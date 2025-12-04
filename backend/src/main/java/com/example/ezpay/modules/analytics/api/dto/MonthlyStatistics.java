package com.example.ezpay.modules.analytics.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * 월별 통계 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyStatistics {
    private int year;
    private int month;
    private BigDecimal totalIncome;
    private BigDecimal totalExpense;
    private List<Object> dailySummaries; // DailySummary 리스트
    private List<Object> categoryAmounts; // CategoryAmount 리스트
}
