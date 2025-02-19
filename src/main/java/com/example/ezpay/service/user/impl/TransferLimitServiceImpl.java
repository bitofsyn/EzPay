package com.example.ezpay.service.user.impl;

import com.example.ezpay.exception.CustomNotFoundException;
import com.example.ezpay.model.user.TransferLimit;
import com.example.ezpay.model.user.User;
import com.example.ezpay.repository.user.TransferLimitRepository;
import com.example.ezpay.repository.user.UserRepository;
import com.example.ezpay.request.TransferLimitRequest;
import com.example.ezpay.service.user.TransferLimitService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TransferLimitServiceImpl implements TransferLimitService {
    private final TransferLimitRepository transferLimitRepository;
    private final UserRepository userRepository;

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
