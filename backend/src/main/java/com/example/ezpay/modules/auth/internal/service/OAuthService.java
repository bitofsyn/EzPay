package com.example.ezpay.modules.auth.internal.service;

import com.example.ezpay.modules.auth.api.dto.LoginResponse;
import com.example.ezpay.modules.auth.api.dto.OAuthLoginRequest;
import com.example.ezpay.shared.common.enums.AuthProvider;

/**
 * 소셜 로그인 처리 서비스.
 * 인가 코드 → 제공자 사용자 정보 조회 → 회원 식별/생성 → JWT 발급까지를 담당한다.
 */
public interface OAuthService {

    /**
     * 소셜 로그인/회원가입을 수행하고 일반 로그인과 동일한 형태의 응답(JWT 포함)을 반환한다.
     *
     * @param provider   소셜 제공자 (KAKAO/NAVER)
     * @param request    인가 코드/state/redirectUri
     * @param ipAddress  클라이언트 IP (로그인 이력용)
     * @param deviceInfo 디바이스 정보 (로그인 이력용)
     */
    LoginResponse login(AuthProvider provider, OAuthLoginRequest request, String ipAddress, String deviceInfo);
}
