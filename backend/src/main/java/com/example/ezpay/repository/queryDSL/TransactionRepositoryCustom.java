package com.example.ezpay.repository.queryDSL;

import com.example.ezpay.model.user.Transaction;
import com.example.ezpay.response.SpendingSummaryDto;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.util.List;

public interface TransactionRepositoryCustom {
    List<Transaction> findTransactionByAccount(Long accountId);

    List<Transaction> findSentTransactions(Long senderAccountId);

    List<Transaction> findReceivedTransactions(Long receiverAccountId);

    BigDecimal sumTodayTransactionBySender(Long senderAccountId, LocalDate today);

    // FDS velocity 룰: 특정 시각 이후 해당 계좌가 시도한 송금 건수(단기간 과도 송금 탐지용)
    long countRecentTransfersBySender(Long senderAccountId, Timestamp since);

    List<SpendingSummaryDto> getSpendingSummaryByCategory(Long userId, Timestamp start, Timestamp end);

    List<Transaction> searchTransactions(Long userId, String keyword, LocalDate startDate, LocalDate endDate);
}
