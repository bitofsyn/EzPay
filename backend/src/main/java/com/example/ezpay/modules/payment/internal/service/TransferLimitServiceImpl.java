package com.example.ezpay.modules.payment.internal.service;

import com.example.ezpay.shared.exception.CustomNotFoundException;
import com.example.ezpay.model.user.Transaction;
import com.example.ezpay.model.user.TransferLimit;
import com.example.ezpay.model.user.User;
import com.example.ezpay.repository.user.TransactionRepository;
import com.example.ezpay.repository.user.TransferLimitRepository;
import com.example.ezpay.repository.user.UserRepository;
import com.example.ezpay.modules.payment.api.dto.TransferLimitRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TransferLimitServiceImpl implements TransferLimitService {
    private final TransferLimitRepository transferLimitRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;

    private static final BigDecimal DEFAULT_DAILY_LIMIT = new BigDecimal("1000000.00");
    private static final BigDecimal DEFAULT_TRANSACTION_LIMIT = new BigDecimal("100000.00");

    @Override
    public List<TransferLimit> getAllTransferLimits() {
        return transferLimitRepository.findAll();
    }

    @Override
    public TransferLimit readUserTransferLimit(Long userId) {
        return transferLimitRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultTransferLimit(userId));
    }

    @Override
    @Transactional
    public void updateUserTransferLimit(Long userId, TransferLimitRequest transferLimitRequest) {
        TransferLimit transferLimit = transferLimitRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultTransferLimit(userId));

        transferLimit.setDailyLimit(transferLimitRequest.getDailyLimit());
        transferLimit.setPerTransactionLimit(transferLimitRequest.getPerTransactionLimit());
        transferLimitRepository.save(transferLimit);
    }

    @Override
    @Transactional
    public void resetUserTransferLimit(Long userId) {
        TransferLimit transferLimit = transferLimitRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultTransferLimit(userId));

        transferLimit.setDailyLimit(DEFAULT_DAILY_LIMIT);
        transferLimit.setPerTransactionLimit(DEFAULT_TRANSACTION_LIMIT);
        transferLimitRepository.save(transferLimit);
    }

    @Override
    public BigDecimal getRemainingDailyLimit(Long userId) {
        TransferLimit transferLimit = transferLimitRepository.findByUserId(userId)
                .orElse(null);

        if (transferLimit == null) {
            return BigDecimal.ZERO;
        }

        // 오늘 사용한 총 송금액 조회 (사용자의 모든 계좌에서)
        User user = userRepository.findById(userId)
                .orElse(null);

        if (user == null) {
            return BigDecimal.ZERO;
        }

        // 사용자의 모든 계좌에서 오늘 송금한 총액 계산
        BigDecimal todayTotal = user.getAccounts().stream()
                .map(account -> {
                    BigDecimal total = transactionRepository.sumTodayTransactionBySender(
                            account.getAccountId(),
                            LocalDate.now()
                    );
                    return total != null ? total : BigDecimal.ZERO;
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal remaining = transferLimit.getDailyLimit().subtract(todayTotal);
        return remaining.compareTo(BigDecimal.ZERO) > 0 ? remaining : BigDecimal.ZERO;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean canTransfer(Long userId, BigDecimal amount) {
        if (amount == null || amount.signum() <= 0) {
            return false;
        }
        TransferLimit limit = transferLimitRepository.findByUserId(userId).orElse(null);
        return limit != null
                && amount.compareTo(limit.getPerTransactionLimit()) <= 0
                && amount.compareTo(getRemainingDailyLimit(userId)) <= 0;
    }

    @Override
    @Transactional
    public void initializeDefaultLimit(Long userId, BigDecimal dailyLimit, BigDecimal perTransactionLimit) {
        if (dailyLimit == null || perTransactionLimit == null
                || dailyLimit.signum() <= 0 || perTransactionLimit.signum() <= 0
                || perTransactionLimit.compareTo(dailyLimit) > 0) {
            throw new IllegalArgumentException("송금 한도는 0보다 커야 하며 건당 한도는 일일 한도를 초과할 수 없습니다.");
        }

        TransferLimit limit = transferLimitRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultTransferLimit(userId));
        limit.setDailyLimit(dailyLimit);
        limit.setPerTransactionLimit(perTransactionLimit);
        transferLimitRepository.save(limit);
    }

    private TransferLimit createDefaultTransferLimit(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomNotFoundException("사용자를 찾을 수 없습니다."));

        TransferLimit newLimit = TransferLimit.builder()
                .user(user)
                .dailyLimit(DEFAULT_DAILY_LIMIT)
                .perTransactionLimit(DEFAULT_TRANSACTION_LIMIT)
                .build();

        return transferLimitRepository.save(newLimit);
    }
}
