package com.example.ezpay.modules.statistics.internal.service;

import com.example.ezpay.repository.user.TransactionRepository;
import com.example.ezpay.response.SpendingSummaryDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class StatisticsServiceImpl implements StatisticsService {

    private final TransactionRepository transactionRepository;

    @Override
    @Transactional(readOnly = true)
    public List<SpendingSummaryDto> getSpendingSummary(Long userId, int year, int month) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID cannot be null.");
        }
        return transactionRepository.getSpendingSummaryByCategory(userId, year, month);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Transaction> searchTransactions(Long userId, String keyword, LocalDate startDate, LocalDate endDate) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID cannot be null.");
        }
        return transactionRepository.searchTransactions(userId, keyword, startDate, endDate);
    }
}
