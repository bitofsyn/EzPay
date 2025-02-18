package com.example.ezpay.service.admin;

import com.example.ezpay.model.user.Transaction;

import java.util.List;

public interface AdminTransactionService {
    List<Transaction> getAlltransactions();
    void deleteTransaction(Long transactionId);
}
