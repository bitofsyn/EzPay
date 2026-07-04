package com.example.ezpay.modules.auth.internal.oauth;

import com.example.ezpay.shared.common.enums.AuthProvider;

/**
 * 소셜 제공자별 OAuth 클라이언트 공통 인터페이스.
 * 구현체(KakaoOAuthClient/NaverOAuthClient)는 각자 담당 제공자만 처리한다.
 */
public interface OAuthClient {

    /** 이 클라이언트가 담당하는 제공자 */
    AuthProvider getProvider();

    /**
     * authorization code 로 access token 을 교환한 뒤, 사용자 정보를 조회해 정규화하여 반환한다.
     *
     * @param code        프론트가 제공자로부터 받은 인가 코드
     * @param redirectUri authorize 요청에 사용한 것과 동일한 redirect-uri (검증용)
     * @param state       CSRF 방지용 state (네이버 토큰 교환에 필요, 카카오는 무시)
     */
    OAuthUserInfo fetchUserInfo(String code, String redirectUri, String state);
}
