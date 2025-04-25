package com.example.ezpay.repository.user;

import com.example.ezpay.model.user.Accounts;
import com.example.ezpay.model.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Accounts, Long> {
    boolean existsByAccountNumber(String accountNumber);
    List<Accounts> findByUserUserId(Long userId); // 특정 사용자의 계좌 조회
    Optional<Accounts> findByAccountNumber(String accountNumber);

    List<Accounts> findByUser(User user);
}
