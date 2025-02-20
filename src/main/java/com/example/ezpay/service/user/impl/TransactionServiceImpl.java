package com.example.ezpay.service.user.impl;

import com.example.ezpay.exception.CustomNotFoundException;
import com.example.ezpay.exception.TransferLimitExceededException;
import com.example.ezpay.kafka.TransactionProducer;
import com.example.ezpay.model.enums.ErrorLogStatus;
import com.example.ezpay.model.enums.TransactionStatus;
import com.example.ezpay.model.kafka.TransferEvent;
import com.example.ezpay.model.user.Accounts;
import com.example.ezpay.model.user.Transaction;
import com.example.ezpay.model.user.TransferLimit;
import com.example.ezpay.repository.user.AccountRepository;
import com.example.ezpay.repository.user.TransactionRepository;
import com.example.ezpay.repository.user.TransferLimitRepository;
import com.example.ezpay.service.user.ErrorLogService;
import com.example.ezpay.service.user.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TransactionServiceImpl implements TransactionService {
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final TransactionProducer transactionProducer;
    private final TransferLimitRepository transferLimitRepository;
    private final ErrorLogService errorLogService;

    // 송금 요청 (kafka 이벤트 발행)
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
        try{
            Accounts fromAccount = accountRepository.findById(event.getFromAccountId())
                    .orElseThrow(() -> new CustomNotFoundException("출금 계좌를 찾을 수 없습니다."));

            Accounts toAccount = accountRepository.findById(event.getToAccountId())
                    .orElseThrow(() -> new CustomNotFoundException("입금 계좌를 찾을 수 없습니다."));

            TransferLimit transferLimit = transferLimitRepository.findByUserId(fromAccount.getUser().getUserId())
                    .orElseThrow(() -> new CustomNotFoundException("송금 한도 정보를 찾을 수 없습니다."));

            if (fromAccount.getBalance().compareTo(event.getAmount()) < 0) {
                throw new IllegalArgumentException("잔액 부족으로 송금할 수 없습니다.");
            }

            // ✅ 1회 송금 한도 체크
            if (event.getAmount().compareTo(transferLimit.getPerTransactionLimit()) > 0) {
                throw new TransferLimitExceededException("1회 송금 한도를 초과했습니다.");
            }

            // ✅ 하루 총 송금 한도 체크(QueryDSL)
            BigDecimal todayTotalTransfers = transactionRepository.sumTodayTransactionBySender(fromAccount.getAccountId(), LocalDate.now());
            if (todayTotalTransfers == null) {
                todayTotalTransfers = BigDecimal.ZERO;
            }

            if (todayTotalTransfers.add(event.getAmount()).compareTo(transferLimit.getDailyLimit()) > 0) {
                throw new TransferLimitExceededException("하루 송금 한도를 초과했습니다.");
            }

            // ✅ 잔액 체크
            if (fromAccount.getBalance().compareTo(event.getAmount()) <= 0) {
                throw new IllegalArgumentException("잔액 부족으로 송금할 수 없습니다.");
            }

            // ✅ 송금 처리
            fromAccount.setBalance(fromAccount.getBalance().subtract(event.getAmount()));
            toAccount.setBalance(toAccount.getBalance().add(event.getAmount()));

            accountRepository.save(fromAccount);
            accountRepository.save(toAccount);

            // ✅ 거래 기록 저장
            Transaction transaction = new Transaction();
            transaction.setSenderAccount(fromAccount);
            transaction.setReceiverAccount(toAccount);
            transaction.setAmount(event.getAmount());
            transaction.setStatus(TransactionStatus.SUCCESS);
            transaction.setDescription("송금 완료");

            return transactionRepository.save(transaction);
        }catch (CustomNotFoundException | TransferLimitExceededException | IllegalArgumentException e) {
            // 장애 발생시 로그 저장
            errorLogService.logError("Transaction Service", e.getMessage(), ErrorLogStatus.UNRESOLVED);
            throw e;
        } catch (Exception e) {
            // 예상치 못한 오류 발생시 로그 저장
            errorLogService.logError("Transaction Service", "알수 없는 오류 발생:" + e.getMessage(), ErrorLogStatus.UNRESOLVED);
            throw e;
        }
    }


    @Override
    public List<Transaction> getTransactionByAccount(Long accountId) {
        return transactionRepository.findTransactionByAccount(accountId);
    }


    @Override
    public Transaction getTransactionById(Long transactionId) {
        return transactionRepository.findById(transactionId)
                .orElseThrow(() -> new CustomNotFoundException("거래 내역을 찾을 수 없습니다. : " + transactionId));
    }

    // 거래 취소
    @Override
    @Transactional
    public void cancelTransaction(Long transactionId) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new CustomNotFoundException("거래 내역을 찾을 수 없습니다: " + transactionId));

        if (!transaction.getStatus().equals(TransactionStatus.SUCCESS)) {
            throw new IllegalArgumentException("이미 취소된 거래이거나 실패한 거래입니다.");
        }

        // 24시간 이내 취소 가능하도록 체크
        long now = System.currentTimeMillis();
        long transactionTime = transaction.getTransactionDate().getTime();
        if ((now - transactionTime) > 24 * 60 * 60 * 1000) {
            throw new IllegalArgumentException("거래는 24시간 이내에만 취소할 수 있습니다.");
        }

        Accounts sender = transaction.getSenderAccount();
        Accounts receiver = transaction.getReceiverAccount();

        // 💡 취소 시 원래대로 돌려놓음
        sender.setBalance(sender.getBalance().add(transaction.getAmount()));
        receiver.setBalance(receiver.getBalance().subtract(transaction.getAmount()));

        accountRepository.save(sender);
        accountRepository.save(receiver);

        transaction.setStatus(TransactionStatus.CANCELLED);
        transactionRepository.save(transaction);
    }

    @Override
    public List<Transaction> getSentTransactions(Long senderAccountId) {
        return transactionRepository.findSentTransactions(senderAccountId);
    }

    @Override
    public List<Transaction> getReceivedTransactions(Long receiverAccountId) {
        return transactionRepository.findReceivedTransactions(receiverAccountId);
    }


}
