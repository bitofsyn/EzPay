package com.example.ezpay.modules.payment.internal.facade;

import com.example.ezpay.model.user.Transaction;
import com.example.ezpay.model.user.TransferLimit;
import com.example.ezpay.modules.payment.api.dto.TransactionInfo;
import com.example.ezpay.modules.payment.api.dto.TransferCommand;
import com.example.ezpay.modules.payment.api.dto.TransferLimitInfo;
import com.example.ezpay.modules.payment.api.facade.PaymentFacade;
import com.example.ezpay.modules.payment.internal.service.TransactionService;
import com.example.ezpay.modules.payment.internal.service.TransferLimitService;
import com.example.ezpay.request.TransferRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.ZoneId;
import java.util.List;
import java.util.stream.Collectors;

/**
 * PaymentFacade 구현체
 * 다른 모듈에서 Payment 기능을 사용할 때 이 Facade를 통해 접근
 */
@Component
@RequiredArgsConstructor
public class PaymentFacadeImpl implements PaymentFacade {

    private final TransactionService transactionService;
    private final TransferLimitService transferLimitService;

    @Override
    public void initiateTransfer(TransferCommand command) {
        // TransferCommand -> TransferRequest 변환
        TransferRequest request = new TransferRequest();
        request.setFromAccountId(command.getFromAccountId());
        request.setToAccountId(command.getToAccountId());
        request.setAmount(command.getAmount());
        request.setMemo(command.getMemo());
        request.setCategory(command.getCategory());

        transactionService.transferMoney(request);
    }

    @Override
    public TransactionInfo getTransaction(Long transactionId) {
        Transaction transaction = transactionService.getTransactionById(transactionId);
        return convertToTransactionInfo(transaction);
    }

    @Override
    public List<TransactionInfo> getTransactionsByAccount(Long accountId) {
        List<Transaction> transactions = transactionService.getTransactionByAccount(accountId);
        return transactions.stream()
                .map(this::convertToTransactionInfo)
                .collect(Collectors.toList());
    }

    @Override
    public List<TransactionInfo> getSentTransactions(Long senderAccountId) {
        List<Transaction> transactions = transactionService.getSentTransactions(senderAccountId);
        return transactions.stream()
                .map(this::convertToTransactionInfo)
                .collect(Collectors.toList());
    }

    @Override
    public List<TransactionInfo> getReceivedTransactions(Long receiverAccountId) {
        List<Transaction> transactions = transactionService.getReceivedTransactions(receiverAccountId);
        return transactions.stream()
                .map(this::convertToTransactionInfo)
                .collect(Collectors.toList());
    }

    @Override
    public List<TransactionInfo> getRecentTransactions(Long accountId, String sort, int limit) {
        List<Transaction> transactions = transactionService.getRecentTransactionByAccount(accountId, sort, limit);
        return transactions.stream()
                .map(this::convertToTransactionInfo)
                .collect(Collectors.toList());
    }

    @Override
    public TransferLimitInfo getTransferLimit(Long userId) {
        TransferLimit transferLimit = transferLimitService.readUserTransferLimit(userId);
        BigDecimal remainingLimit = transferLimitService.getRemainingDailyLimit(userId);

        BigDecimal usedAmount = transferLimit.getDailyLimit().subtract(remainingLimit);

        return TransferLimitInfo.builder()
                .limitId(transferLimit.getUserId())
                .userId(userId)
                .dailyLimit(transferLimit.getDailyLimit())
                .perTransactionLimit(transferLimit.getPerTransactionLimit())
                .usedAmount(usedAmount)
                .remainingAmount(remainingLimit)
                .build();
    }

    @Override
    public boolean canTransfer(Long userId, BigDecimal amount) {
        return transferLimitService.canTransfer(userId, amount);
    }

    @Override
    public BigDecimal getRemainingDailyLimit(Long userId) {
        return transferLimitService.getRemainingDailyLimit(userId);
    }

    @Override
    public void initializeTransferLimit(Long userId, BigDecimal dailyLimit, BigDecimal perTransactionLimit) {
        transferLimitService.initializeDefaultLimit(userId, dailyLimit, perTransactionLimit);
    }

    // Transaction -> TransactionInfo 변환 헬퍼 메서드
    private TransactionInfo convertToTransactionInfo(Transaction transaction) {
        return TransactionInfo.builder()
                .transactionId((long) transaction.getTransactionId())
                .senderAccountId(transaction.getSenderAccount().getAccountId())
                .receiverAccountId(transaction.getReceiverAccount().getAccountId())
                .amount(transaction.getAmount())
                .status(transaction.getStatus())
                .createdAt(transaction.getTransactionDate().toInstant()
                        .atZone(ZoneId.systemDefault())
                        .toLocalDateTime())
                .build();
    }
}
