package com.example.ezpay.modules.auth.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 소셜 로그인(OAuth) 제공자 설정.
 * application.yml 의 `oauth.*` 값을 바인딩한다. (client-id/secret 등 민감정보는 환경변수로 주입)
 */
@Getter
@Setter
@ConfigurationProperties(prefix = "oauth")
public class OAuthProperties {

    private Provider kakao = new Provider();
    private Provider naver = new Provider();

    @Getter
    @Setter
    public static class Provider {
        /** 제공자 콘솔에서 발급한 REST API 키(client-id) */
        private String clientId;
        /** 제공자 client-secret (카카오는 선택, 네이버는 필수) */
        private String clientSecret;
        /** authorization code → access token 교환 엔드포인트 */
        private String tokenUri;
        /** access token → 사용자 정보 조회 엔드포인트 */
        private String userInfoUri;

        public boolean isConfigured() {
            return clientId != null && !clientId.isBlank();
        }
    }
}
