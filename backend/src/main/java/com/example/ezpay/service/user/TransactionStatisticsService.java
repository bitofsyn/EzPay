package com.example.ezpay.service.user;

import com.example.ezpay.model.user.DailyDetail;
import com.example.ezpay.model.user.DailySummary;
import com.example.ezpay.response.DailySummaryResponse;

import java.util.List;

public interface TransactionStatisticsService {
    List<DailySummaryResponse> getMonthStatistics(Long userId, int year, int month);
}
