package com.example.ezpay.repository.queryDSL;

import com.example.ezpay.model.user.Transaction;

import java.util.List;

public interface TransactionRepositoryCustom {
    List<Transaction> findTransactionByAccount(Long accountId);

    List<Transaction> findSentTransactions(Long senderAccountId);

    List<Transaction> findReceivedTransactions(Long receiverAccountId);
}
