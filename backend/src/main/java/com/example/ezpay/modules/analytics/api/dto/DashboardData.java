package com.example.ezpay.modules.analytics.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 대시보드 데이터 DTO
 * 사용자, 계좌, 최근 거래 등을 종합
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardData {
    private Object userData;      // UserInfo
    private Object accountData;   // List<AccountInfo>
    private Object recentTransactions; // List<TransactionInfo>
}
