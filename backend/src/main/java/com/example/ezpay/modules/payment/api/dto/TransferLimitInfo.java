package com.example.ezpay.modules.payment.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 송금 한도 정보 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransferLimitInfo {
    private Long limitId;
    private Long userId;
    private BigDecimal dailyLimit;
    private BigDecimal perTransactionLimit;
    private BigDecimal usedAmount;
    private BigDecimal remainingAmount;
}
