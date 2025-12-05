package com.example.ezpay.modules.auth.api.facade;

import com.example.ezpay.modules.auth.api.dto.*;

/**
 * Auth 모듈의 공개 API Facade
 * 회원가입, 로그인, 비밀번호 재설정, 이메일 찾기 등
 */
public interface AuthFacade {

    // 회원가입
    RegisterResponse register(RegisterRequest request);

    // 로그인
    LoginResponse login(LoginRequest request, String ipAddress, String deviceInfo);

    // 비밀번호 재설정 요청 (이메일로 토큰 발송)
    void initiatePasswordReset(String email);

    // 재설정 토큰 검증
    boolean verifyResetToken(String token);

    // 비밀번호 재설정
    void resetPassword(String token, String newPassword);

    // 이메일 찾기 (전화번호와 이름으로)
    FindEmailResponse findEmailByPhoneAndName(FindEmailRequest request);
}
