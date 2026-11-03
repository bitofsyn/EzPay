package com.example.ezpay.modules.auth.internal.service;

import com.example.ezpay.model.user.User;
import com.example.ezpay.modules.auth.api.dto.PasswordResetRequest;
import com.example.ezpay.modules.auth.internal.entity.PasswordReset;
import com.example.ezpay.modules.auth.internal.repository.PasswordResetRepository;
import com.example.ezpay.repository.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class PasswordResetServiceImplTest {

    @Test
    void createsRequestAndSendsResetLink() {
        PasswordResetRepository resetRepository = mock(PasswordResetRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        PasswordResetMailService mailService = mock(PasswordResetMailService.class);
        User user = User.builder().userId(1L).email("user@ezpay.test").build();
        when(userRepository.findByEmail("user@ezpay.test")).thenReturn(Optional.of(user));
        PasswordResetServiceImpl service = new PasswordResetServiceImpl(
                resetRepository, userRepository, mock(PasswordEncoder.class), mailService);
        PasswordResetRequest request = new PasswordResetRequest();
        request.setEmail("user@ezpay.test");

        String token = service.createPasswordResetRequest(request);

        assertThat(token).isNotBlank();
        var savedRequest = org.mockito.ArgumentCaptor.forClass(PasswordReset.class);
        verify(resetRepository).save(savedRequest.capture());
        assertThat(savedRequest.getValue().getResetToken()).isNotEqualTo(token);
        verify(mailService).sendResetLink("user@ezpay.test", token, 30);
    }

    @Test
    void unknownEmailDoesNotRevealWhetherAccountExists() {
        PasswordResetRepository resetRepository = mock(PasswordResetRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        PasswordResetMailService mailService = mock(PasswordResetMailService.class);
        when(userRepository.findByEmail("missing@ezpay.test")).thenReturn(Optional.empty());
        PasswordResetServiceImpl service = new PasswordResetServiceImpl(
                resetRepository, userRepository, mock(PasswordEncoder.class), mailService);
        PasswordResetRequest request = new PasswordResetRequest();
        request.setEmail("missing@ezpay.test");

        assertThat(service.createPasswordResetRequest(request)).isNotBlank();
        verifyNoInteractions(resetRepository, mailService);
    }

    @Test
    void passwordChangeRemainsCompletedWhenConfirmationMailFails() {
        PasswordResetRepository resetRepository = mock(PasswordResetRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        PasswordResetMailService mailService = mock(PasswordResetMailService.class);
        User user = User.builder().userId(1L).email("user@ezpay.test").password("old").build();
        PasswordReset reset = PasswordReset.builder()
                .requestId(10L)
                .user(user)
                .resetToken("valid-token")
                .expirationTime(LocalDateTime.now().plusMinutes(10))
                .used(false)
                .build();
        when(resetRepository.findByResetToken(anyString())).thenReturn(Optional.of(reset));
        when(passwordEncoder.encode("NewPassword1!")).thenReturn("encoded-password");
        doThrow(new IllegalStateException("SMTP unavailable"))
                .when(mailService).sendPasswordChanged(anyString());
        PasswordResetServiceImpl service = new PasswordResetServiceImpl(
                resetRepository, userRepository, passwordEncoder, mailService);

        assertThatCode(() -> service.resetPassword("valid-token", "NewPassword1!"))
                .doesNotThrowAnyException();

        assertThat(user.getPassword()).isEqualTo("encoded-password");
        assertThat(reset.getUsed()).isTrue();
        verify(userRepository).save(user);
        verify(resetRepository).save(reset);
    }
}
