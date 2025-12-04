package com.example.ezpay.modules.analytics.api.facade;

import com.example.ezpay.modules.analytics.api.dto.DashboardData;
import com.example.ezpay.modules.analytics.api.dto.MonthlyStatistics;

/**
 * Analytics 모듈의 공개 API Facade
 * 대시보드, 통계, 거래 필터링 관리
 */
public interface AnalyticsFacade {

    /**
     * 사용자 대시보드 데이터 조회
     */
    DashboardData getDashboardData(Long userId);

    /**
     * 월별 소비 통계 조회
     */
    MonthlyStatistics getMonthlyStatistics(Long accountId, int year, int month);
}
