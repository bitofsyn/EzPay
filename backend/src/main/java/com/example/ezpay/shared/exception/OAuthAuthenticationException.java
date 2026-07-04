package com.example.ezpay.shared.exception;

/**
 * 소셜 로그인(OAuth) 처리 중 제공자 통신/프로토콜 단계에서 발생한 실패.
 * 예) authorization code 만료·불일치, redirect-uri 불일치, 토큰 발급 실패, 사용자 정보 조회 실패.
 * (이메일 중복 등 EzPay 내부 비즈니스 규칙 위반은 IllegalArgumentException 을 사용한다.)
 */
public class OAuthAuthenticationException extends RuntimeException {
    public OAuthAuthenticationException(String message) {
        super(message);
    }

    public OAuthAuthenticationException(String message, Throwable cause) {
        super(message, cause);
    }
}
