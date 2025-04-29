package com.example.ezpay.repository.user;

import com.example.ezpay.model.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByEmail(String email);
    Optional<User> findByEmail(String email);

    // 이메일 찾기
    Optional<User> findByNameAndPhoneNumber(String name, String phoneNumber);
}
