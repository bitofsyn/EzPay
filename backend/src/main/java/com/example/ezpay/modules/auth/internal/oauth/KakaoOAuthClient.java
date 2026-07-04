package com.example.ezpay.modules.auth.internal.oauth;

import com.example.ezpay.modules.auth.config.OAuthProperties;
import com.example.ezpay.shared.common.enums.AuthProvider;
import com.example.ezpay.shared.exception.OAuthAuthenticationException;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

/**
 * 카카오 로그인 클라이언트.
 * 1) authorization code → access token (POST https://kauth.kakao.com/oauth/token)
 * 2) access token → 사용자 정보 (GET https://kapi.kakao.com/v2/user/me)
 * 참고: https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api
 */
@Slf4j
@Component
public class KakaoOAuthClient implements OAuthClient {

    private final RestClient restClient;
    private final OAuthProperties.Provider config;

    public KakaoOAuthClient(RestClient oauthRestClient, OAuthProperties properties) {
        this.restClient = oauthRestClient;
        this.config = properties.getKakao();
    }

    @Override
    public AuthProvider getProvider() {
        return AuthProvider.KAKAO;
    }

    @Override
    public OAuthUserInfo fetchUserInfo(String code, String redirectUri, String state) {
        if (!config.isConfigured()) {
            throw new OAuthAuthenticationException("카카오 로그인이 설정되지 않았습니다. 관리자에게 문의해주세요.");
        }
        String accessToken = requestAccessToken(code, redirectUri);
        return requestUserInfo(accessToken);
    }

    private String requestAccessToken(String code, String redirectUri) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "authorization_code");
        form.add("client_id", config.getClientId());
        form.add("redirect_uri", redirectUri);
        form.add("code", code);
        // client-secret 은 카카오 콘솔에서 활성화한 경우에만 필요
        if (config.getClientSecret() != null && !config.getClientSecret().isBlank()) {
            form.add("client_secret", config.getClientSecret());
        }

        try {
            JsonNode body = restClient.post()
                    .uri(config.getTokenUri())
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(JsonNode.class);

            if (body == null || body.get("access_token") == null) {
                throw new OAuthAuthenticationException("카카오 토큰 응답에 access_token 이 없습니다.");
            }
            return body.get("access_token").asText();
        } catch (RestClientResponseException e) {
            // redirect-uri 불일치, code 만료/재사용 등은 여기서 4xx 로 떨어진다.
            log.warn("카카오 토큰 발급 실패: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new OAuthAuthenticationException("카카오 토큰 발급에 실패했습니다. 인증을 다시 시도해주세요.", e);
        } catch (OAuthAuthenticationException e) {
            throw e;
        } catch (Exception e) {
            throw new OAuthAuthenticationException("카카오 인증 서버와 통신하지 못했습니다.", e);
        }
    }

    private OAuthUserInfo requestUserInfo(String accessToken) {
        try {
            JsonNode body = restClient.get()
                    .uri(config.getUserInfoUri())
                    .header("Authorization", "Bearer " + accessToken)
                    .retrieve()
                    .body(JsonNode.class);

            if (body == null || body.get("id") == null) {
                throw new OAuthAuthenticationException("카카오 사용자 정보를 가져오지 못했습니다.");
            }

            String socialId = body.get("id").asText();

            JsonNode account = body.path("kakao_account");
            String email = account.path("email").isMissingNode() ? null : account.path("email").asText(null);

            JsonNode profile = account.path("profile");
            String nickname = profile.path("nickname").asText(null);
            String profileImage = profile.path("profile_image_url").asText(null);

            return new OAuthUserInfo(AuthProvider.KAKAO, socialId, email, nickname, profileImage);
        } catch (RestClientResponseException e) {
            log.warn("카카오 사용자 정보 조회 실패: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new OAuthAuthenticationException("카카오 사용자 정보 조회에 실패했습니다.", e);
        } catch (OAuthAuthenticationException e) {
            throw e;
        } catch (Exception e) {
            throw new OAuthAuthenticationException("카카오 인증 서버와 통신하지 못했습니다.", e);
        }
    }
}
