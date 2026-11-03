package com.example.ezpay.controller.statistics;

import com.example.ezpay.model.user.Transaction;
import com.example.ezpay.modules.statistics.internal.service.StatisticsService;
import com.example.ezpay.modules.user.api.dto.UserInfo;
import com.example.ezpay.modules.user.api.facade.UserFacade;
import com.example.ezpay.response.SpendingSummaryDto;
import com.example.ezpay.shared.common.dto.CommonResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/statistics") // URL을 /api/statistics로 변경하여 일관성 유지
@RequiredArgsConstructor
public class StatisticsController {

    private final StatisticsService statisticsService;
    private final UserFacade userFacade;

    @GetMapping("/spending-summary")
    public ResponseEntity<CommonResponse<List<SpendingSummaryDto>>> getSpendingSummary(
            // Authentication authentication, // TODO: 개발 완료 후 인증 로직 복구
            @RequestParam("user_id") Long userId,
            @RequestParam("year") int year,
            @RequestParam("month") int month) {
        
        List<SpendingSummaryDto> summary = statisticsService.getSpendingSummary(userId, year, month);
        return ResponseEntity.ok(new CommonResponse<>("success", summary, "월별 지출 내역 조회 성공"));
    }

    @GetMapping("/transactions/search")
    public ResponseEntity<CommonResponse<List<Transaction>>> searchTransactions(
            @RequestParam("user_id") Long userId,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(value = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        List<Transaction> transactions = statisticsService.searchTransactions(userId, keyword, startDate, endDate);
        return ResponseEntity.ok(new CommonResponse<>("success", transactions, "거래 내역 검색 성공"));
    }
}
