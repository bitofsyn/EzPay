package com.example.ezpay.modules.statistics.internal.service;

import com.example.ezpay.response.SpendingSummaryDto;
import java.util.List;

public interface StatisticsService {
    List<SpendingSummaryDto> getSpendingSummary(Long userId, int year, int month);
}
