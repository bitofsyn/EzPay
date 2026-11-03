package com.example.ezpay.controller.user;


import com.example.ezpay.modules.analytics.api.dto.DailySummaryInfo;
import com.example.ezpay.modules.analytics.internal.service.TransactionStatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;
import com.example.ezpay.shared.security.CurrentUserService;

import java.util.List;

@RestController
@RequestMapping("/transactionsStat")
@RequiredArgsConstructor
public class TransactionStatisticsController {

    private final TransactionStatisticsService transactionStatisticsService;
    private final CurrentUserService currentUserService;

    @GetMapping("/monthly")
    public ResponseEntity<List<DailySummaryInfo>> monthly(Authentication authentication,
                                                              @RequestParam Long userId,
                                                              @RequestParam int year,
                                                              @RequestParam int month) {
        currentUserService.requireUserId(authentication, userId);
        List<DailySummaryInfo> result = transactionStatisticsService.getMonthStatistics(userId, year, month);
        return ResponseEntity.ok(result);
    }
}
