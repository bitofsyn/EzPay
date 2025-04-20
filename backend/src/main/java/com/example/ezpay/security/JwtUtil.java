package com.example.ezpay.security;

import com.example.ezpay.model.user.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.security.Key;
import java.util.Base64;
import java.util.Date;

@Component
public class JwtUtil {
    private static final String SECRET_KEY = SecretKeyGenerator.createSecretKey();
    private static final long EXPIRATION_TIME = 1000 * 60 * 60 * 24; // 24시간

    private final Key key = Keys.hmacShaKeyFor(Base64.getDecoder().decode(SECRET_KEY));
    private final JwtParser parser = Jwts.parser().verifyWith((SecretKey) key).build();

    // 1. JWT 생성 메서드
    public String generateToken(User user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + EXPIRATION_TIME);

        return Jwts.builder()
                .subject(user.getEmail())
                .claim("userId", user.getUserId())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    // 2. 토큰에서 email 추출
    public String getEmailFromToken(String token) {
        return parser.parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    // 3. 토큰 유효성 확인
    public boolean validateToken(String token) {
        try {
            parser.parseSignedClaims(token);
            return true;
        } catch (SecurityException | JwtException e) {
            return false;
        }
    }
}
