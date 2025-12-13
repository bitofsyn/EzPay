package com.example.ezpay.repository.queryDSL;

import com.example.ezpay.model.user.Transaction;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface TransactionRepositoryCustom {
    List<Transaction> findTransactionByAccount(Long accountId);

    List<Transaction> findSentTransactions(Long senderAccountId);

    List<Transaction> findReceivedTransactions(Long receiverAccountId);

    BigDecimal sumTodayTransactionBySender(Long senderAccountId, LocalDate today);

    List<Transaction> searchTransactions(Long userId, String keyword, LocalDate startDate, LocalDate endDate);
}
