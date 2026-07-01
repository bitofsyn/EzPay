package com.example.ezpay.modules.admin.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

// 프론트엔드 DashboardMetrics(metricsApi.ts) 응답 DTO
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardMetricsInfo {
    private Long totalUsers;
    private Long activeUsers;
    private Long inactiveUsers;
    private Long lockedUsers;
    private Long totalTransactions;
    private BigDecimal totalVolume;
    private Long dailyTransactionCount;
    private BigDecimal dailyTransactionVolume;
    private Long totalAccounts;
    private Long recentErrors;
    private LocalDateTime lastUpdated;
}
