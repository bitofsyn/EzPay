package com.example.ezpay.modules.analytics.internal.service;

import com.example.ezpay.model.user.Transaction;
import com.example.ezpay.repository.user.TransactionStatisticsRepository;
import com.example.ezpay.response.CategoryAmountResponse;
import com.example.ezpay.response.DailyDetailResponse;
import com.example.ezpay.response.DailySummaryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionStatisticsServiceImpl implements TransactionStatisticsService {
    private final TransactionStatisticsRepository transactionStatisticsRepository;

    @Override
    public List<DailySummaryResponse> getMonthStatistics(Long userId, int year, int month) {
        YearMonth yearMonth = YearMonth.of(year, month);

        // 변환(LocalDate -> LocalDateTime -> Timestamp
        Timestamp start = Timestamp.valueOf(yearMonth.atDay(1).atStartOfDay());
        Timestamp end = Timestamp.valueOf(yearMonth.atEndOfMonth().atTime(23, 59, 59));

        List<Transaction> transactions = transactionStatisticsRepository.findTransactionByMonth(userId, start, end);

        Map<LocalDate, List<Transaction>> groupedByDate = transactions.stream()
                .collect(Collectors.groupingBy(t -> t.getTransactionDate().toInstant()
                        .atZone(ZoneId.of("Asia/Seoul")).toLocalDate()));

        List<DailySummaryResponse> summary = new ArrayList<>();
        for(LocalDate date : groupedByDate.keySet()) {
            List<Transaction> dailyTransactions = groupedByDate.get(date);

            Long income = dailyTransactions.stream()
                    .filter(x -> x.getStatus().name().equals("DEPOSIT"))
                    .map(t -> t.getAmount().longValue())
                    .reduce(0L, Long::sum);

            Long expense = dailyTransactions.stream()
                    .filter(x -> x.getStatus().name().equals("WITHDRAW"))
                    .map(t -> t.getAmount().abs().longValue())
                    .reduce(0L, Long::sum);

            List<DailyDetailResponse> details = dailyTransactions.stream()
                    .map(x -> new DailyDetailResponse(
                            (long) x.getTransactionId(),
                            x.getStatus().name(),
                            x.getSenderAccount().getBankName(),
                            x.getAmount().longValue(),
                            x.getDescription()
                    ))
                    .toList();

            Map<String, Long> categoryMap = dailyTransactions.stream()
                    .collect(Collectors.groupingBy(
                            x -> x.getSenderAccount().getBankName(),
                            Collectors.summingLong(x -> x.getAmount().longValue())
                    ));

            List<CategoryAmountResponse> categories = categoryMap.entrySet().stream()
                    .map(x -> new CategoryAmountResponse(x.getKey(), x.getValue()))
                    .toList();

            summary.add(new DailySummaryResponse(date, income, expense, details, categories));
        }

        summary.sort(Comparator.comparing(DailySummaryResponse::getDate));
        return summary;
    }
}
