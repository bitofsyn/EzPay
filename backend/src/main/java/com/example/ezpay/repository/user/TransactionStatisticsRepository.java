package com.example.ezpay.repository.user;

import com.example.ezpay.model.user.CategoryAmount;
import com.example.ezpay.model.user.DailyDetail;
import com.example.ezpay.model.user.DailySummary;
import com.example.ezpay.model.user.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public interface TransactionStatisticsRepository extends JpaRepository<Transaction, Long> {
    @Query("""
        SELECT t
        FROM Transaction t
        WHERE (t.senderAccount.user.userId = :userId OR t.receiverAccount.user.userId = :userId)
          AND t.transactionDate BETWEEN :startDate AND :endDate
        ORDER BY t.transactionDate ASC
    """)
    List<Transaction> findTransactionByMonth(@Param("userId") Long userId,
                                             @Param("startDate") Timestamp startDate,
                                             @Param("endDate") Timestamp endDate);
}
