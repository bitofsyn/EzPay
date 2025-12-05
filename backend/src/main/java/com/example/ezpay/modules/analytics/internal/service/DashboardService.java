package com.example.ezpay.modules.analytics.internal.service;

import com.example.ezpay.model.user.Transaction;
import com.example.ezpay.response.DashboardResponse;
import org.springframework.security.core.Authentication;

import java.util.List;

/**
 * Analytics 모듈 내부 서비스 - 대시보드 관리
 */
public interface DashboardService {
    DashboardResponse getDashboardInfo(Authentication authentication);
    List<Transaction> getRecentTransactions(Long accountId, String sort, int limit);
}
