package com.example.ezpay.modules.auth.internal.service;

import com.example.ezpay.modules.auth.api.dto.*;

/**
 * Auth 모듈의 내부 인증 서비스
 */
public interface AuthenticationService {

    /**
     * 회원가입
     */
    RegisterResponse register(RegisterRequest request);

    /**
     * 로그인
     */
    LoginResponse login(LoginRequest request, String ipAddress, String deviceInfo);

    /**
     * 이메일 찾기
     */
    FindEmailResponse findEmail(FindEmailRequest request);
}
