package com.example.ezpay.modules.auth.internal.repository;

import com.example.ezpay.modules.auth.internal.entity.PasswordReset;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PasswordResetRepository extends JpaRepository<PasswordReset, Long> {
    // 토큰 기반 요청 찾기
    Optional<PasswordReset> findByResetToken(String token);
}
