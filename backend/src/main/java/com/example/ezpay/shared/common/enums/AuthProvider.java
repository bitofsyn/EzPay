package com.example.ezpay.shared.common.enums;

/**
 * 사용자 인증 수단(가입 경로) 구분값.
 * - LOCAL: 이메일/비밀번호 일반 회원
 * - KAKAO / NAVER: 소셜 로그인 회원
 *
 * 기존(마이그레이션 이전) 회원 레코드는 authProvider 컬럼이 NULL이며,
 * 코드 상에서는 LOCAL과 동일하게 취급한다. (User.getAuthProviderOrLocal 참고)
 */
public enum AuthProvider {
    LOCAL,
    KAKAO,
    NAVER
}
