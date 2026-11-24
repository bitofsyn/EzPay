package com.example.ezpay.repository.user;

import com.example.ezpay.model.user.Accounts;
import com.example.ezpay.model.user.User;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.QueryHint;
import org.springframework.data.jpa.repository.QueryHints;

import java.util.List;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Accounts, Long> {
    boolean existsByAccountNumber(String accountNumber);
    // 대시보드가 Accounts 엔티티를 그대로 직렬화하며 ownerName(user.name)을 읽으므로 소유자를 함께 조회한다.
    @EntityGraph(attributePaths = "user")
    List<Accounts> findByUserUserId(Long userId); // 특정 사용자의 계좌 조회
    Optional<Accounts> findByAccountNumber(String accountNumber);

    List<Accounts> findByUser(User user);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout", value = "3000"))
    @Query("select a from Accounts a where a.accountId = :accountId")
    Optional<Accounts> findByIdForUpdate(@Param("accountId") Long accountId);
}
