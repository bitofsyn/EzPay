package com.example.ezpay.modules.admin.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

// 일별 거래 통계 DTO
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyTransactionStats {
    private String date;              // 날짜 (MM/DD 형식)
    private String dayOfWeek;         // 요일
    private Long transactionCount;    // 거래 건수
    private BigDecimal totalVolume;   // 거래 총액
}
