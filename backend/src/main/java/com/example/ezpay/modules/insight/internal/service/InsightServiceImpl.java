package com.example.ezpay.modules.insight.internal.service;

import com.example.ezpay.model.user.NormalizedTransaction;
import com.example.ezpay.modules.insight.api.dto.InsightResponse;
import com.example.ezpay.repository.user.NormalizedTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InsightServiceImpl implements InsightService {
    private final NormalizedTransactionRepository normalizedTransactionRepository;

    @Override
    public List<InsightResponse> generateInsights(Long userId) {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        OffsetDateTime currentMonthStart = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        OffsetDateTime previousMonthStart = currentMonthStart.minusMonths(1);
        OffsetDateTime previousMonthEnd = currentMonthStart.minusNanos(1);

        List<NormalizedTransaction> allTransactions = normalizedTransactionRepository.findByUserUserIdOrderByPostedAtDesc(userId);
        List<NormalizedTransaction> currentMonthTransactions = normalizedTransactionRepository
                .findByUserUserIdAndPostedAtBetweenOrderByPostedAtDesc(userId, currentMonthStart, now);
        List<NormalizedTransaction> previousMonthTransactions = normalizedTransactionRepository
                .findByUserUserIdAndPostedAtBetweenOrderByPostedAtDesc(userId, previousMonthStart, previousMonthEnd);

        List<InsightResponse> insights = new ArrayList<>();

        buildTopCategoryInsight(currentMonthTransactions).ifPresent(insights::add);
        buildCategorySpikeInsight(currentMonthTransactions, previousMonthTransactions).ifPresent(insights::add);
        buildRecurringSpendingInsight(allTransactions).ifPresent(insights::add);

        if (insights.isEmpty()) {
            insights.add(InsightResponse.builder()
                    .type("baseline")
                    .title("거래 데이터가 쌓이는 중입니다")
                    .summary("더 많은 거래가 동기화되면 카테고리 변화와 반복 지출 패턴을 자동으로 분석합니다.")
                    .severity("info")
                    .evidenceLabel("동기화 거래")
                    .evidenceValue(String.valueOf(allTransactions.size()))
                    .build());
        }

        return insights;
    }

    private java.util.Optional<InsightResponse> buildTopCategoryInsight(List<NormalizedTransaction> transactions) {
        Map<String, BigDecimal> totals = outflowCategoryTotals(transactions);
        return totals.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(entry -> InsightResponse.builder()
                        .type("top-category")
                        .title("이번 달 가장 큰 지출 카테고리")
                        .summary(String.format("%s 카테고리가 이번 달 지출에서 가장 큰 비중을 차지했습니다.", entry.getKey()))
                        .severity("info")
                        .evidenceLabel("누적 지출")
                        .evidenceValue(formatWon(entry.getValue()))
                        .build());
    }

    private java.util.Optional<InsightResponse> buildCategorySpikeInsight(
            List<NormalizedTransaction> currentMonth,
            List<NormalizedTransaction> previousMonth
    ) {
        Map<String, BigDecimal> currentTotals = outflowCategoryTotals(currentMonth);
        Map<String, BigDecimal> previousTotals = outflowCategoryTotals(previousMonth);

        return currentTotals.entrySet().stream()
                .filter(entry -> previousTotals.containsKey(entry.getKey()))
                .map(entry -> {
                    BigDecimal previous = previousTotals.get(entry.getKey());
                    if (previous.compareTo(BigDecimal.ZERO) <= 0) {
                        return null;
                    }
                    BigDecimal increase = entry.getValue().subtract(previous);
                    double ratio = increase.doubleValue() / previous.doubleValue();
                    return Map.entry(entry.getKey(), Map.entry(entry.getValue(), ratio));
                })
                .filter(Objects::nonNull)
                .filter(entry -> entry.getValue().getValue() >= 0.3d)
                .max(Comparator.comparingDouble(entry -> entry.getValue().getValue()))
                .map(entry -> InsightResponse.builder()
                        .type("category-spike")
                        .title("전월 대비 급증한 지출 카테고리")
                        .summary(String.format(
                                "%s 지출이 지난달보다 %.0f%% 증가했습니다. 과소비 여부를 확인해볼 필요가 있습니다.",
                                entry.getKey(),
                                entry.getValue().getValue() * 100
                        ))
                        .severity("warning")
                        .evidenceLabel("이번 달 지출")
                        .evidenceValue(formatWon(entry.getValue().getKey()))
                        .build());
    }

    private java.util.Optional<InsightResponse> buildRecurringSpendingInsight(List<NormalizedTransaction> transactions) {
        Map<String, Long> merchantCounts = transactions.stream()
                .filter(tx -> "OUTFLOW".equals(tx.getDirection()))
                .map(tx -> {
                    if (tx.getMerchantName() != null && !tx.getMerchantName().isBlank()) {
                        return tx.getMerchantName();
                    }
                    return tx.getDescription();
                })
                .filter(Objects::nonNull)
                .filter(name -> !name.isBlank())
                .collect(Collectors.groupingBy(name -> name, Collectors.counting()));

        return merchantCounts.entrySet().stream()
                .filter(entry -> entry.getValue() >= 3)
                .max(Map.Entry.comparingByValue())
                .map(entry -> InsightResponse.builder()
                        .type("recurring-spending")
                        .title("반복 결제 후보를 찾았습니다")
                        .summary(String.format("%s 관련 결제가 최근 거래에서 %d회 반복되었습니다.", entry.getKey(), entry.getValue()))
                        .severity("info")
                        .evidenceLabel("반복 횟수")
                        .evidenceValue(entry.getValue() + "회")
                        .build());
    }

    private Map<String, BigDecimal> outflowCategoryTotals(List<NormalizedTransaction> transactions) {
        return transactions.stream()
                .filter(tx -> "OUTFLOW".equals(tx.getDirection()))
                .collect(Collectors.groupingBy(
                        tx -> tx.getPrimaryCategory() == null || tx.getPrimaryCategory().isBlank() ? "미분류" : tx.getPrimaryCategory(),
                        Collectors.mapping(NormalizedTransaction::getAmount, Collectors.reducing(BigDecimal.ZERO, BigDecimal::add))
                ));
    }

    private String formatWon(BigDecimal amount) {
        return String.format("%,.0f원", amount);
    }
}
