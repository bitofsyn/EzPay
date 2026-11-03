package com.example.ezpay.modules.auth.internal.service;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class PasswordResetMailServiceTest {

    @Test
    void sendsEncodedResetLinkWithoutExposingTokenInApiResponse() {
        JavaMailSender mailSender = mock(JavaMailSender.class);
        PasswordResetMailService service = new PasswordResetMailService(mailSender, "https://ezpay.test");

        service.sendResetLink("user@ezpay.test", "reset-token", 30);

        ArgumentCaptor<SimpleMailMessage> message = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(message.capture());
        assertThat(message.getValue().getTo()).containsExactly("user@ezpay.test");
        assertThat(message.getValue().getText())
                .contains("https://ezpay.test/reset-password?token=reset-token")
                .contains("30분");
    }
}
