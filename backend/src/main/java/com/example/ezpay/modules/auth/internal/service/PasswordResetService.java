package com.example.ezpay.modules.auth.internal.service;

import com.example.ezpay.modules.auth.api.dto.PasswordResetRequest;

public interface PasswordResetService {
    // 비밀번호 재설정 요청 생성
    String createPasswordResetRequest(PasswordResetRequest passwordResetRequest);

    // 토큰 유효성 검증
    boolean validatePasswordResetToken(String token);

    // 새 비밀번호로 변경
    void resetPassword(String token, String newPassword);
}
