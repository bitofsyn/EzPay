package com.example.ezpay.service.user;

import com.example.ezpay.model.kafka.TransferEvent;
import com.example.ezpay.model.user.Transaction;
import com.example.ezpay.response.AccountOwnerResponse;

import java.math.BigDecimal;
import java.util.List;

public interface TransactionService {
    // kafka 이벤트 발생
    void transferMoney(Long fromAccountId, Long toAccountId, BigDecimal amount);

    // 송금 처리 및 거래 기록 저장
    Transaction processTransfer(TransferEvent transferEvent);

    List<Transaction> getTransactionByAccount(Long accountId);
    Transaction getTransactionById(Long transactionId);
    void cancelTransaction(Long transactionId);

    // 특정 계좌에서 송금한 거래 조회
    List<Transaction> getSentTransactions(Long senderAccountId);

    // 특정 계좌에서 받은 거래 조회
    List<Transaction> getReceivedTransactions(Long receiverAccountId);

    // 계좌번호로 소유자 조회
    AccountOwnerResponse getOwnerNameByAccountNumber(String accountNumber);

    // 대시보드 (최근 거래 내역)
    List<Transaction> getRecentTransactionByAccount(Long accountId, String sort, int limit);
}
