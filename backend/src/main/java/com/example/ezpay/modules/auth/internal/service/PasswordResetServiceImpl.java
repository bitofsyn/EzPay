package com.example.ezpay.modules.auth.internal.service;

import com.example.ezpay.shared.exception.CustomNotFoundException;
import com.example.ezpay.modules.auth.internal.entity.PasswordReset;
import com.example.ezpay.model.user.User;
import com.example.ezpay.modules.auth.internal.repository.PasswordResetRepository;
import com.example.ezpay.repository.user.UserRepository;
import com.example.ezpay.modules.auth.api.dto.PasswordResetRequest;
import com.example.ezpay.modules.auth.internal.service.PasswordResetService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetServiceImpl implements PasswordResetService {
    private final PasswordResetRepository passwordResetRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetMailService passwordResetMailService;

    private static final long PASSWORD_RESET_EXPIRATION_MINUTES = 30;

    // 비밀번호 재설정 요청 생성 (토큰 생성 및 저장)
    @Override
    @Transactional
    public String createPasswordResetRequest(PasswordResetRequest passwordResetRequest) {
        String resetToken = UUID.randomUUID().toString();
        Optional<User> userOptional = userRepository.findByEmail(passwordResetRequest.getEmail());
        if (userOptional.isEmpty()) {
            // 계정 존재 여부가 외부에 노출되지 않도록 실제 사용자와 동일한 형태로 종료한다.
            return resetToken;
        }
        User user = userOptional.get();
        LocalDateTime expirationTime = LocalDateTime.now().plusMinutes(PASSWORD_RESET_EXPIRATION_MINUTES); // 30분 유효

        PasswordReset request = passwordResetRequest.toEntity(user, hashToken(resetToken), expirationTime);
        passwordResetRepository.save(request);
        passwordResetMailService.sendResetLink(user.getEmail(), resetToken, PASSWORD_RESET_EXPIRATION_MINUTES);

        return resetToken;
    }

    // 토큰 유효성 확인
    @Override
    public boolean validatePasswordResetToken(String token) {
        Optional<PasswordReset> request = passwordResetRepository.findByResetToken(hashToken(token));

        // 만료시간 체크 로직 수정
        return request.isPresent() && request.get().getExpirationTime().isAfter(LocalDateTime.now()) && !request.get().getUsed();
    }


    @Override
    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordReset request = passwordResetRepository.findByResetToken(hashToken(token))
                .orElseThrow(() -> new CustomNotFoundException("유효하지 않은 비밀번호 재설정 토큰입니다."));

        // 만료시간 및 사용 여부 체크 로직 수정
        if (request.getUsed()) {
            throw new IllegalArgumentException("이미 사용된 비밀번호 재설정 토큰입니다.");
        }

        // 토큰 만료 여부 확인
        if (request.getExpirationTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("비밀번호 재설정 토큰이 만료되었습니다.");
        }

        validatePasswordStrength(newPassword);

        // 비밀번호 변경
        User user = request.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // 토큰 사용 처리
        request.setUsed(true);
        passwordResetRepository.save(request);

        try {
            passwordResetMailService.sendPasswordChanged(user.getEmail());
        } catch (Exception e) {
            // 비밀번호 변경은 이미 완료되었으므로 확인 메일 장애로 트랜잭션을 되돌리지 않는다.
            log.warn("비밀번호 변경 확인 메일 발송 실패: email={}", user.getEmail(), e);
        }

    }

    private void validatePasswordStrength(String password) {
        // 최소 8자 이상, 숫자, 대문자, 특수문자 포함
        String passwordPattern = "^(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$";

        if (!password.matches(passwordPattern)) {
            throw new IllegalArgumentException("비밀번호는 최소 8자 이상, 숫자, 대문자, 특수문자를 포함해야 합니다.");
        }
    }

    private String hashToken(String token) {
        if (token == null || token.isBlank()) {
            return "";
        }
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("비밀번호 재설정 토큰을 처리할 수 없습니다.", e);
        }
    }

}
