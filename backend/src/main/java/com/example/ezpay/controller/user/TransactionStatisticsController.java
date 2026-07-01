package com.example.ezpay.controller.user;


import com.example.ezpay.modules.analytics.api.dto.DailySummaryInfo;
import com.example.ezpay.modules.analytics.internal.service.TransactionStatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/transactionsStat")
@RequiredArgsConstructor
public class TransactionStatisticsController {

    private final TransactionStatisticsService transactionStatisticsService;

    @GetMapping("/monthly")
    public ResponseEntity<List<DailySummaryInfo>> monthly(@RequestParam Long userId,
                                                              @RequestParam int year,
                                                              @RequestParam int month) {
        List<DailySummaryInfo> result = transactionStatisticsService.getMonthStatistics(userId, year, month);
        return ResponseEntity.ok(result);
    }
}
