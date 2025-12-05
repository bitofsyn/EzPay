package com.example.ezpay.modules.payment.internal.service;

import com.example.ezpay.model.user.TransferLimit;
import com.example.ezpay.request.TransferLimitRequest;

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

    // 송금 가능 여부 확인
    boolean canTransfer(Long userId, BigDecimal amount);

    // 남은 일일 한도 계산
    BigDecimal getRemainingDailyLimit(Long userId);

    // 신규 사용자 기본 한도 초기화
    void initializeDefaultLimit(Long userId, BigDecimal dailyLimit, BigDecimal perTransactionLimit);
}
