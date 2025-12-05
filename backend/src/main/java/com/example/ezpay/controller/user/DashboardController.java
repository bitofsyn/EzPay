package com.example.ezpay.controller.user;

import com.example.ezpay.model.user.Transaction;
import com.example.ezpay.modules.analytics.internal.service.DashboardService;
import com.example.ezpay.shared.common.dto.CommonResponse;
import com.example.ezpay.response.DashboardResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    // 대시보드
    @GetMapping
    public ResponseEntity<CommonResponse<DashboardResponse>> getDashboardInfo(Authentication authentication) {
        DashboardResponse response = dashboardService.getDashboardInfo(authentication);
        return ResponseEntity.ok(new CommonResponse<>("success", response, "사용자 정보 조회 성공 "));
    }

    // 최근 거래 내역(정렬화)
    @GetMapping("/accounts/{accountId}/transactions")
    public ResponseEntity<CommonResponse<List<Transaction>>> getRecentTransactions(@PathVariable Long accountId,
                                                                                   @RequestParam(defaultValue = "desc") String sort,
                                                                                   @RequestParam(defaultValue = "10") int limit) {
        List<Transaction> transactions = dashboardService.getRecentTransactions(accountId, sort, limit);
        return ResponseEntity.ok(new CommonResponse<>("success", transactions, "최근 거래 내역 조회 성공"));
    }
}
