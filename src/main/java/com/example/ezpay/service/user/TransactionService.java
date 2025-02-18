package com.example.ezpay.service.user;

import com.example.ezpay.model.kafka.TransferEvent;
import com.example.ezpay.model.user.Transaction;

import java.math.BigDecimal;

public interface TransactionService {
    // kafka 이벤트 발생
    void transferMoney(Long fromAccountId, Long toAccountId, BigDecimal amount);

    // 송금 처리 및 거래 기록 저장
    Transaction processTransfer(TransferEvent transferEvent);
}
