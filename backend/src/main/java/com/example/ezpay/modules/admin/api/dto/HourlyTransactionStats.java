package com.example.ezpay.modules.admin.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

// 시간대별 거래 통계 DTO
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HourlyTransactionStats {
    private String hour;              // 시간 (HH:00 형식)
    private Long transactionCount;    // 거래 건수
    private BigDecimal totalVolume;   // 거래 총액
}
