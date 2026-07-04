package com.example.ezpay.modules.auth.internal.oauth;

import com.example.ezpay.shared.common.enums.AuthProvider;

/**
 * 각 소셜 제공자의 사용자 정보 응답을 EzPay 내부 표준 형태로 정규화한 값.
 *
 * @param provider     소셜 제공자
 * @param socialId     제공자가 발급한 고유 사용자 ID (필수)
 * @param email        이메일 (제공자/사용자 동의에 따라 null 가능)
 * @param nickname     닉네임/이름 (null 가능)
 * @param profileImage 프로필 이미지 URL (null 가능)
 */
public record OAuthUserInfo(
        AuthProvider provider,
        String socialId,
        String email,
        String nickname,
        String profileImage
) {
    public boolean hasEmail() {
        return email != null && !email.isBlank();
    }
}
