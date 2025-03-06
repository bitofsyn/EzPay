package com.example.ezpay.repository.user;

import com.example.ezpay.model.user.PasswordReset;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PasswordResetRepository extends JpaRepository<PasswordReset, Long> {
    // 토큰 기반 요청 찾기
    Optional<PasswordReset> findByResetToken(String token);
}
