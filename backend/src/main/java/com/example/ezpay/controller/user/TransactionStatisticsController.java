package com.example.ezpay.controller.user;


import com.example.ezpay.response.DailySummaryResponse;
import com.example.ezpay.service.user.TransactionStatisticsService;
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
    public ResponseEntity<List<DailySummaryResponse>> monthly(@RequestParam Long userId,
                                                              @RequestParam int year,
                                                              @RequestParam int month) {
        List<DailySummaryResponse> result = transactionStatisticsService.getMonthStatistics(userId, year, month);
        return ResponseEntity.ok(result);
    }
}
