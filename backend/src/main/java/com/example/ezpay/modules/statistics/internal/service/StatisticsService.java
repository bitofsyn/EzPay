package com.example.ezpay.modules.statistics.internal.service;

import com.example.ezpay.model.user.Transaction;
import com.example.ezpay.response.SpendingSummaryDto;

import java.time.LocalDate;
import java.util.List;

public interface StatisticsService {
    List<SpendingSummaryDto> getSpendingSummary(Long userId, int year, int month);
    List<Transaction> searchTransactions(Long userId, String keyword, LocalDate startDate, LocalDate endDate);
}
