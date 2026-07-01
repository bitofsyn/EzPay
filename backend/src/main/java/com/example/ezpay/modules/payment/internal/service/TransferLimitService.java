package com.example.ezpay.modules.payment.internal.service;

import com.example.ezpay.model.user.TransferLimit;
import com.example.ezpay.modules.payment.api.dto.TransferLimitRequest;

import java.math.BigDecimal;
import java.util.List;

/**
 * Payment 모듈 내부 서비스 - 송금 한도 관리
 */
public interface TransferLimitService {
    List<TransferLimit> getAllTransferLimits();
    TransferLimit readUserTransferLimit(Long userId);
    void updateUserTransferLimit(Long userId, TransferLimitRequest transferLimitRequest);
    void resetUserTransferLimit(Long userId);

    // 남은 일일 한도 계산
    BigDecimal getRemainingDailyLimit(Long userId);
}
