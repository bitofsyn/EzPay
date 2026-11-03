package com.example.ezpay.modules.analytics.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import com.example.ezpay.modules.account.api.dto.AccountInfo;
import com.example.ezpay.modules.payment.api.dto.TransactionInfo;
import com.example.ezpay.modules.user.api.dto.UserInfo;

import java.util.List;

/**
 * 대시보드 데이터 DTO
 * 사용자, 계좌, 최근 거래 등을 종합
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardData {
    private UserInfo userData;
    private List<AccountInfo> accountData;
    private List<TransactionInfo> recentTransactions;
}
