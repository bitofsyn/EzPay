package com.example.ezpay.security;

import com.example.ezpay.model.user.PasswordReset;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {
    private static final String SECRET_KEY = SecretKeyGenerator.createSecretKey();
    private static final long EXPIRATION_TIME = 1000 * 60 * 60 * 24; // 24시간

    private final SecretKey key = Keys.hmacShaKeyFor(SECRET_KEY.getBytes());

    // 1. JWT 생성 메서드
    public String generateToken(String email) {
        return Jwts.builder()
                .subject(email)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(key)
                .compact();
    }

    // 2. JWT 검증 및 파싱 메서드
    public String extractEmail(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    // 3. 토큰 만료 확인
    public boolean isTokenValid(String token) {
        try {
            return !Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload()
                    .getExpiration()
                    .before(new Date());
        } catch (Exception e) {
            return false;
        }
    }
}
