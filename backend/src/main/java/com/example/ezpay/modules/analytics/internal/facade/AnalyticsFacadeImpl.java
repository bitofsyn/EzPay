package com.example.ezpay.modules.analytics.internal.facade;

import com.example.ezpay.modules.analytics.api.dto.DashboardData;
import com.example.ezpay.modules.analytics.api.dto.MonthlyStatistics;
import com.example.ezpay.modules.analytics.api.facade.AnalyticsFacade;
import com.example.ezpay.modules.analytics.internal.service.DashboardService;
import com.example.ezpay.modules.analytics.internal.service.TransactionStatisticsService;
import com.example.ezpay.modules.analytics.api.dto.DailySummaryInfo;
import com.example.ezpay.modules.user.api.facade.UserFacade;
import com.example.ezpay.modules.account.api.dto.AccountInfo;
import com.example.ezpay.modules.account.api.facade.AccountFacade;
import com.example.ezpay.modules.payment.api.dto.TransactionInfo;
import com.example.ezpay.modules.payment.api.facade.PaymentFacade;
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
    private final AccountFacade accountFacade;
    private final PaymentFacade paymentFacade;
    private final TransactionStatisticsService transactionStatisticsService;

    @Override
    public DashboardData getDashboardData(Long userId) {
        List<AccountInfo> accounts = accountFacade.getAccountsByUserId(userId);
        List<TransactionInfo> recentTransactions = accounts.stream()
                .filter(account -> Boolean.TRUE.equals(account.getIsMainAccount()))
                .findFirst()
                .map(account -> paymentFacade.getRecentTransactions(account.getAccountId(), "desc", 10))
                .orElseGet(List::of);

        return DashboardData.builder()
                .userData(userFacade.getUserById(userId))
                .accountData(accounts)
                .recentTransactions(recentTransactions)
                .build();
    }

    @Override
    public MonthlyStatistics getMonthlyStatistics(Long accountId, int year, int month) {
        List<DailySummaryInfo> summaries = transactionStatisticsService.getMonthStatistics(accountId, year, month);

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
