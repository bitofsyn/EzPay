package com.example.ezpay.modules.admin.internal.service;

import com.example.ezpay.model.user.Transaction;
import com.example.ezpay.model.user.TransferLimit;
import com.example.ezpay.model.user.User;
import com.example.ezpay.modules.payment.api.dto.TransactionInfo;
import com.example.ezpay.modules.payment.api.dto.TransferLimitInfo;
import com.example.ezpay.modules.payment.internal.service.TransferLimitService;
import com.example.ezpay.modules.user.api.dto.UserInfo;
import com.example.ezpay.repository.user.TransactionRepository;
import com.example.ezpay.repository.user.UserRepository;
import com.example.ezpay.request.TransferLimitRequest;
import com.example.ezpay.shared.exception.CustomNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.ZoneId;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Admin 모듈 내부 서비스 구현
 * User, Payment 모듈의 리포지토리와 서비스를 활용하여 관리자 기능 제공
 */
@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final TransferLimitService transferLimitService;

    @Override
    @Transactional(readOnly = true)
    public List<UserInfo> getAllUsers() {
        List<User> users = userRepository.findAll();
        return users.stream()
                .map(this::convertToUserInfo)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TransactionInfo> getAllTransactions() {
        List<Transaction> transactions = transactionRepository.findAll();
        return transactions.stream()
                .map(this::convertToTransactionInfo)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TransactionInfo> getUserTransactions(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomNotFoundException("사용자를 찾을 수 없습니다: " + userId));

        // 사용자의 모든 계좌를 조회하고, 각 계좌의 거래 내역을 수집
        return user.getAccounts().stream()
                .flatMap(account -> transactionRepository.findTransactionByAccount(account.getAccountId()).stream())
                .distinct()
                .map(this::convertToTransactionInfo)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteTransaction(Long transactionId) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new CustomNotFoundException("거래 내역을 찾을 수 없습니다: " + transactionId));

        transactionRepository.delete(transaction);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TransferLimitInfo> getAllTransferLimits() {
        List<TransferLimit> transferLimits = transferLimitService.getAllTransferLimits();
        return transferLimits.stream()
                .map(this::convertToTransferLimitInfo)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void updateUserTransferLimit(Long userId, TransferLimitRequest request) {
        transferLimitService.updateUserTransferLimit(userId, request);
    }

    @Override
    @Transactional
    public void resetUserTransferLimit(Long userId) {
        transferLimitService.resetUserTransferLimit(userId);
    }

    /**
     * User 엔티티를 UserInfo DTO로 변환
     */
    private UserInfo convertToUserInfo(User user) {
        return UserInfo.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .name(user.getName())
                .phone(user.getPhoneNumber())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toLocalDateTime() : null)
                .build();
    }

    /**
     * Transaction 엔티티를 TransactionInfo DTO로 변환
     */
    private TransactionInfo convertToTransactionInfo(Transaction transaction) {
        return TransactionInfo.builder()
                .transactionId((long) transaction.getTransactionId())
                .senderAccountId(transaction.getSenderAccount().getAccountId())
                .receiverAccountId(transaction.getReceiverAccount().getAccountId())
                .amount(transaction.getAmount())
                .memo(null) // Admin에서는 메모 정보 불필요
                .category(null) // Admin에서는 카테고리 정보 불필요
                .status(transaction.getStatus())
                .createdAt(transaction.getTransactionDate().toInstant()
                        .atZone(ZoneId.systemDefault())
                        .toLocalDateTime())
                .build();
    }

    /**
     * TransferLimit 엔티티를 TransferLimitInfo DTO로 변환
     */
    private TransferLimitInfo convertToTransferLimitInfo(TransferLimit transferLimit) {
        Long userId = transferLimit.getUserId();
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
}
