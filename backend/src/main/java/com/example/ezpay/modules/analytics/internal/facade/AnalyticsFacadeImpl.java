package com.example.ezpay.modules.analytics.internal.facade;

import com.example.ezpay.modules.analytics.api.dto.DashboardData;
import com.example.ezpay.modules.analytics.api.dto.MonthlyStatistics;
import com.example.ezpay.modules.analytics.api.facade.AnalyticsFacade;
import com.example.ezpay.modules.analytics.internal.service.DashboardService;
import com.example.ezpay.modules.analytics.internal.service.TransactionStatisticsService;
import com.example.ezpay.modules.user.api.facade.UserFacade;
import com.example.ezpay.response.DailySummaryResponse;
import com.example.ezpay.response.DashboardResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

/**
 * AnalyticsFacade 구현체
 * 다른 모듈에서 Analytics 기능을 사용할 때 이 Facade를 통해 접근
 */
@Component
@RequiredArgsConstructor
public class AnalyticsFacadeImpl implements AnalyticsFacade {

    private final UserFacade userFacade;
    private final DashboardService dashboardService;
    private final TransactionStatisticsService transactionStatisticsService;

    @Override
    public DashboardData getDashboardData(Long userId) {
        // userId로 email을 조회해야 하지만, DashboardService는 Authentication을 받음
        // 일단 임시로 null 처리 (실제로는 UserFacade에서 email을 가져와야 함)
        // 또는 DashboardService를 수정하여 userId를 받도록 변경

        // 현재 구조상 DashboardService.getDashboardInfo는 Authentication을 받으므로
        // 직접 데이터를 조합하는 방식으로 변경
        return DashboardData.builder()
                .userData(userFacade.getUserById(userId))
                .accountData(null) // 추후 AccountFacade 사용
                .recentTransactions(null) // 추후 PaymentFacade 사용
                .build();
    }

    @Override
    public MonthlyStatistics getMonthlyStatistics(Long accountId, int year, int month) {
        // accountId를 userId로 변환해야 할 수도 있음
        // 일단 accountId를 userId로 간주
        List<DailySummaryResponse> summaries = transactionStatisticsService.getMonthStatistics(accountId, year, month);

        // 총 수입/지출 계산
        BigDecimal totalIncome = summaries.stream()
                .map(s -> BigDecimal.valueOf(s.getIncome()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalExpense = summaries.stream()
                .map(s -> BigDecimal.valueOf(s.getExpense()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return MonthlyStatistics.builder()
                .year(year)
                .month(month)
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .dailySummaries(summaries.stream().map(s -> (Object) s).toList())
                .categoryAmounts(summaries.isEmpty() ? List.of() :
                        summaries.get(0).getCategories().stream().map(c -> (Object) c).toList())
                .build();
    }
}
