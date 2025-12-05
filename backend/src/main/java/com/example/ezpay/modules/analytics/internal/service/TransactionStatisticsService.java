package com.example.ezpay.modules.analytics.internal.service;

import com.example.ezpay.response.DailySummaryResponse;

import java.util.List;

/**
 * Analytics 모듈 내부 서비스 - 거래 통계 관리
 */
public interface TransactionStatisticsService {
    List<DailySummaryResponse> getMonthStatistics(Long userId, int year, int month);
}
