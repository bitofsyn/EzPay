package com.example.ezpay.repository.user;

import com.example.ezpay.model.user.User;
import com.example.ezpay.shared.common.enums.AuthProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByEmail(String email);
    Optional<User> findByEmail(String email);

    // 이메일 찾기
    Optional<User> findByNameAndPhoneNumber(String name, String phoneNumber);

    // 소셜 로그인: (제공자 + 소셜 고유 ID)로 기존 소셜 회원 조회
    Optional<User> findByAuthProviderAndSocialId(AuthProvider authProvider, String socialId);
}
