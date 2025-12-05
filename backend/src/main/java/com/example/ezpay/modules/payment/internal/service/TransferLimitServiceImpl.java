package com.example.ezpay.modules.payment.internal.service;

import com.example.ezpay.shared.exception.CustomNotFoundException;
import com.example.ezpay.model.user.Transaction;
import com.example.ezpay.model.user.TransferLimit;
import com.example.ezpay.model.user.User;
import com.example.ezpay.repository.user.TransactionRepository;
import com.example.ezpay.repository.user.TransferLimitRepository;
import com.example.ezpay.repository.user.UserRepository;
import com.example.ezpay.request.TransferLimitRequest;
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
    public boolean canTransfer(Long userId, BigDecimal amount) {
        TransferLimit transferLimit = transferLimitRepository.findByUserId(userId)
                .orElse(null);

        if (transferLimit == null) {
            return false;
        }

        // 1회 한도 체크
        if (amount.compareTo(transferLimit.getPerTransactionLimit()) > 0) {
            return false;
        }

        // 일일 한도 체크
        BigDecimal remainingLimit = getRemainingDailyLimit(userId);
        return amount.compareTo(remainingLimit) <= 0;
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
    @Transactional
    public void initializeDefaultLimit(Long userId, BigDecimal dailyLimit, BigDecimal perTransactionLimit) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomNotFoundException("사용자를 찾을 수 없습니다."));

        TransferLimit newLimit = TransferLimit.builder()
                .user(user)
                .dailyLimit(dailyLimit != null ? dailyLimit : DEFAULT_DAILY_LIMIT)
                .perTransactionLimit(perTransactionLimit != null ? perTransactionLimit : DEFAULT_TRANSACTION_LIMIT)
                .build();

        transferLimitRepository.save(newLimit);
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
