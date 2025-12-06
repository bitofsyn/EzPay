package com.example.ezpay.modules.admin.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

// Admin 대시보드 통계 정보 DTO
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardInfo {
    // 사용자 통계
    private Long totalUsers;           // 전체 사용자 수
    private Long activeUsers;          // 활성 사용자 수
    private Long inactiveUsers;        // 비활성 사용자 수
    private Long lockedUsers;          // 잠금 사용자 수

    // 거래 통계
    private Long totalTransactions;    // 전체 거래 수
    private Long todayTransactions;    // 오늘 거래 수
    private BigDecimal todayTransactionVolume;  // 오늘 거래 총액
    private BigDecimal totalTransactionVolume;  // 전체 거래 총액

    // 계좌 통계
    private Long totalAccounts;        // 전체 계좌 수

    // 최근 에러 수
    private Long recentErrors;         // 최근 미해결 에러 수
}
