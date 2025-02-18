package com.example.ezpay.service.user.impl;

import com.example.ezpay.exception.CustomNotFoundException;
import com.example.ezpay.kafka.TransactionProducer;
import com.example.ezpay.model.enums.TransactionStatus;
import com.example.ezpay.model.kafka.TransferEvent;
import com.example.ezpay.model.user.Accounts;
import com.example.ezpay.model.user.Transaction;
import com.example.ezpay.repository.user.AccountRepository;
import com.example.ezpay.repository.user.TransactionRepository;
import com.example.ezpay.service.user.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class TransactionServiceImpl implements TransactionService {
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final TransactionProducer transactionProducer;

    // 송금 요청
    @Override
    public void transferMoney(Long fromAccountId, Long toAccountId, BigDecimal amount) {
        // 1. 송금 이벤트 객체 생성
        TransferEvent event = new TransferEvent(fromAccountId, toAccountId, amount);

        // 2. Kafka에 이벤트 발행
        transactionProducer.sendTransferEvent(event);
    }

    // kafka 이벤트 수신 후 송금 처리
    @Override
    @Transactional(transactionManager = "transactionManager")
    public Transaction processTransfer(TransferEvent event) {
        Accounts fromAccount = accountRepository.findById(event.getFromAccountId())
                .orElseThrow(() -> new CustomNotFoundException("출금 계좌를 찾을 수 없습니다."));

        Accounts toAccount = accountRepository.findById(event.getToAccountId())
                .orElseThrow(() -> new CustomNotFoundException("입금 계좌를 찾을 수 없습니다."));

        if (fromAccount.getBalance().compareTo(event.getAmount()) < 0) {
            throw new IllegalArgumentException("잔액 부족으로 송금할 수 없습니다.");
        }

        // 송금 처리
        fromAccount.setBalance(fromAccount.getBalance().subtract(event.getAmount()));
        toAccount.setBalance(toAccount.getBalance().add(event.getAmount()));

        accountRepository.save(fromAccount);
        accountRepository.save(toAccount);

        // 거래 내역 저장
        Transaction transaction =  new Transaction();
        transaction.setSenderAccountId(fromAccount);
        transaction.setReceiverAccountId(toAccount);
        transaction.setAmount(event.getAmount());
        transaction.setStatus(TransactionStatus.SUCCESS);
        transaction.setDescription("송금 완료");

        return transactionRepository.save(transaction);
    }
}
