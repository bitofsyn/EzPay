package com.example.ezpay.modules.auth.internal.oauth;

import com.example.ezpay.modules.auth.config.OAuthProperties;
import com.example.ezpay.shared.common.enums.AuthProvider;
import com.example.ezpay.shared.exception.OAuthAuthenticationException;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * 네이버 로그인 클라이언트.
 * 1) authorization code → access token (GET https://nid.naver.com/oauth2.0/token)
 * 2) access token → 사용자 정보 (GET https://openapi.naver.com/v1/nid/me)
 * 참고: https://developers.naver.com/docs/login/api
 */
@Slf4j
@Component
public class NaverOAuthClient implements OAuthClient {

    private final RestClient restClient;
    private final OAuthProperties.Provider config;

    public NaverOAuthClient(RestClient oauthRestClient, OAuthProperties properties) {
        this.restClient = oauthRestClient;
        this.config = properties.getNaver();
    }

    @Override
    public AuthProvider getProvider() {
        return AuthProvider.NAVER;
    }

    @Override
    public OAuthUserInfo fetchUserInfo(String code, String redirectUri, String state) {
        if (!config.isConfigured()) {
            throw new OAuthAuthenticationException("네이버 로그인이 설정되지 않았습니다. 관리자에게 문의해주세요.");
        }
        String accessToken = requestAccessToken(code, state);
        return requestUserInfo(accessToken);
    }

    private String requestAccessToken(String code, String state) {
        // 네이버 토큰 엔드포인트는 쿼리 파라미터 방식. state 는 authorize 요청 때와 동일해야 한다.
        String uri = UriComponentsBuilder.fromUriString(config.getTokenUri())
                .queryParam("grant_type", "authorization_code")
                .queryParam("client_id", config.getClientId())
                .queryParam("client_secret", config.getClientSecret())
                .queryParam("code", code)
                .queryParam("state", state)
                .build(true)
                .toUriString();

        try {
            JsonNode body = restClient.get()
                    .uri(uri)
                    .retrieve()
                    .body(JsonNode.class);

            // 네이버는 실패 시 200 응답 본문에 error 필드를 담아 반환하기도 한다.
            if (body != null && body.hasNonNull("error")) {
                log.warn("네이버 토큰 발급 오류: {} - {}", body.path("error").asText(), body.path("error_description").asText());
                throw new OAuthAuthenticationException("네이버 토큰 발급에 실패했습니다. 인증을 다시 시도해주세요.");
            }
            if (body == null || body.get("access_token") == null) {
                throw new OAuthAuthenticationException("네이버 토큰 응답에 access_token 이 없습니다.");
            }
            return body.get("access_token").asText();
        } catch (RestClientResponseException e) {
            log.warn("네이버 토큰 발급 실패: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new OAuthAuthenticationException("네이버 토큰 발급에 실패했습니다. 인증을 다시 시도해주세요.", e);
        } catch (OAuthAuthenticationException e) {
            throw e;
        } catch (Exception e) {
            throw new OAuthAuthenticationException("네이버 인증 서버와 통신하지 못했습니다.", e);
        }
    }

    private OAuthUserInfo requestUserInfo(String accessToken) {
        try {
            JsonNode body = restClient.get()
                    .uri(config.getUserInfoUri())
                    .header("Authorization", "Bearer " + accessToken)
                    .retrieve()
                    .body(JsonNode.class);

            // 네이버 응답: { resultcode, message, response: { id, email, nickname, profile_image } }
            if (body == null || !"00".equals(body.path("resultcode").asText())) {
                throw new OAuthAuthenticationException("네이버 사용자 정보를 가져오지 못했습니다.");
            }

            JsonNode response = body.path("response");
            String socialId = response.path("id").asText(null);
            if (socialId == null) {
                throw new OAuthAuthenticationException("네이버 사용자 식별자를 가져오지 못했습니다.");
            }
            String email = response.path("email").asText(null);
            String nickname = response.path("nickname").asText(null);
            String profileImage = response.path("profile_image").asText(null);

            return new OAuthUserInfo(AuthProvider.NAVER, socialId, email, nickname, profileImage);
        } catch (RestClientResponseException e) {
            log.warn("네이버 사용자 정보 조회 실패: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new OAuthAuthenticationException("네이버 사용자 정보 조회에 실패했습니다.", e);
        } catch (OAuthAuthenticationException e) {
            throw e;
        } catch (Exception e) {
            throw new OAuthAuthenticationException("네이버 인증 서버와 통신하지 못했습니다.", e);
        }
    }
}
