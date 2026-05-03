package com.example.ezpay.repository.user;

import com.example.ezpay.model.user.Transaction;
import com.example.ezpay.repository.queryDSL.TransactionRepositoryCustom;
import com.example.ezpay.response.SpendingSummaryDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

public interface TransactionRepository extends JpaRepository<Transaction, Long>, TransactionRepositoryCustom {
    Page<Transaction> findBySenderAccount_AccountIdOrReceiverAccount_AccountId(Long senderId, Long receiverId, Pageable pageable);
    boolean existsByRequestId(String requestId);
    Optional<Transaction> findByRequestId(String requestId);

    @Query("SELECT new com.example.ezpay.response.SpendingSummaryDto(t.category, SUM(t.amount)) " +
           "FROM Transaction t " +
           "WHERE t.senderAccount.user.userId = :userId " +
           "AND t.status = com.example.ezpay.shared.common.enums.TransactionStatus.SUCCESS " +
           "AND t.transactionDate >= :startDate " +
           "AND t.transactionDate < :endDate " +
           "GROUP BY t.category")
    List<SpendingSummaryDto> getSpendingSummaryByCategory(
            @Param("userId") Long userId,
            @Param("startDate") Timestamp startDate,
            @Param("endDate") Timestamp endDate
    );
}
