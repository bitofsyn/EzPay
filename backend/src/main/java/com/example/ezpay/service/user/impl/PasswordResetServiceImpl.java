package com.example.ezpay.service.user.impl;

import com.example.ezpay.exception.CustomNotFoundException;
import com.example.ezpay.model.user.PasswordReset;
import com.example.ezpay.model.user.User;
import com.example.ezpay.repository.user.PasswordResetRepository;
import com.example.ezpay.repository.user.UserRepository;
import com.example.ezpay.request.PasswordResetRequest;
import com.example.ezpay.service.user.PasswordResetService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PasswordResetServiceImpl implements PasswordResetService {
    private final PasswordResetRepository passwordResetRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private static final long PASSWORD_RESET_EXPIRATION_MINUTES = 30;

    // 비밀번호 재설정 요청 생성 (토큰 생성 및 저장)
    @Override
    @Transactional
    public String createPasswordResetRequest(PasswordResetRequest passwordResetRequest) {
        User user = userRepository.findByEmail(passwordResetRequest.getEmail())
                .orElseThrow(() -> new CustomNotFoundException("해당 이메일의 사용자를 찾을 수 없습니다. "));

        String resetToken = UUID.randomUUID().toString();
        LocalDateTime expirationTime = LocalDateTime.now().plusMinutes(PASSWORD_RESET_EXPIRATION_MINUTES); // 30분 유효

        PasswordReset request = passwordResetRequest.toEntity(user, resetToken, expirationTime);
        passwordResetRepository.save(request);

        return resetToken;
    }

    // 토큰 유효성 확인
    @Override
    public boolean validatePasswordResetToken(String token) {
        Optional<PasswordReset> request = passwordResetRepository.findByResetToken(token);

        // 🔥 만료시간 체크 로직 수정
        return request.isPresent() && request.get().getExpirationTime().isAfter(LocalDateTime.now()) && !request.get().getUsed();
    }


    @Override
    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordReset request = passwordResetRepository.findByResetToken(token)
                .orElseThrow(() -> new CustomNotFoundException("유효하지 않은 비밀번호 재설정 토큰입니다."));

        // 🔥 만료시간 및 사용 여부 체크 로직 수정
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

        // TODO: 이메일 알림 발송

    }

    private void validatePasswordStrength(String password) {
        // ✅ 최소 8자 이상, 숫자, 대문자, 특수문자 포함
        String passwordPattern = "^(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$";

        if (!password.matches(passwordPattern)) {
            throw new IllegalArgumentException("비밀번호는 최소 8자 이상, 숫자, 대문자, 특수문자를 포함해야 합니다.");
        }
    }

}
