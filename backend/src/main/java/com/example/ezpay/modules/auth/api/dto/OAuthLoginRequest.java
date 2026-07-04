package com.example.ezpay.modules.auth.api.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

/**
 * 소셜 로그인 콜백 요청.
 * 프론트가 제공자로부터 받은 authorization code 를 백엔드로 전달한다.
 */
@Getter
@Setter
public class OAuthLoginRequest {

    @NotBlank(message = "인가 코드가 필요합니다.")
    private String code;

    // CSRF 방지용 state (네이버 필수, 카카오는 선택)
    private String state;

    // authorize 요청에 사용한 redirect-uri (토큰 교환 시 동일해야 함). 미전달 시 서버 기본값 사용.
    private String redirectUri;
}
