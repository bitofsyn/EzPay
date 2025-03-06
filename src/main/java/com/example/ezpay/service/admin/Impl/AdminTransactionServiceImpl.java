package com.example.ezpay.service.admin.Impl;

import com.example.ezpay.exception.CustomNotFoundException;
import com.example.ezpay.model.user.Transaction;
import com.example.ezpay.repository.user.TransactionRepository;
import com.example.ezpay.service.admin.AdminTransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminTransactionServiceImpl implements AdminTransactionService {
    private final TransactionRepository transactionRepository;

    @Override
    public List<Transaction> getAlltransactions() {
        return transactionRepository.findAll();
    }

    @Override
    @Transactional
    public void deleteTransaction(Long transactionId) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new CustomNotFoundException("거래 내역을 찾을 수 없습니다. : " + transactionId));

        transactionRepository.delete(transaction);
    }
}
