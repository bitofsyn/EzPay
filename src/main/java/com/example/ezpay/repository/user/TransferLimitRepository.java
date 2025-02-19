package com.example.ezpay.repository.user;

import com.example.ezpay.model.user.TransferLimit;
import com.example.ezpay.model.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TransferLimitRepository extends JpaRepository<TransferLimit, Long> {
    Optional<TransferLimit> findByUserId(Long userId);

    Long user(User user);
}
