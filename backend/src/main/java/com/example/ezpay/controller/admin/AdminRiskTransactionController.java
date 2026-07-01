package com.example.ezpay.controller.admin;

import com.example.ezpay.modules.risk.dto.RiskActionResult;
import com.example.ezpay.modules.risk.dto.RiskTransactionInfo;
import com.example.ezpay.modules.risk.service.RiskTransactionService;
import com.example.ezpay.shared.common.dto.CommonResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// 프론트엔드 riskApi.ts가 기대하는 위험거래 조회/승인/차단 API
@RestController
@RequestMapping("/admin/risk-transactions")
@RequiredArgsConstructor
public class AdminRiskTransactionController {

    private final RiskTransactionService riskTransactionService;

    @GetMapping
    public ResponseEntity<CommonResponse<List<RiskTransactionInfo>>> getRiskTransactions(
            @RequestParam(required = false) String filter) {
        List<RiskTransactionInfo> transactions = riskTransactionService.getRiskTransactions(filter);
        return ResponseEntity.ok(new CommonResponse<>("success", transactions, "위험 거래 목록 조회 성공"));
    }

    @PostMapping("/{transactionId}/approve")
    public ResponseEntity<CommonResponse<RiskActionResult>> approveRiskTransaction(
            @PathVariable String transactionId) {
        RiskActionResult result = riskTransactionService.approve(transactionId);
        return ResponseEntity.ok(new CommonResponse<>("success", result, "위험 거래 승인 성공"));
    }

    @PostMapping("/{transactionId}/block")
    public ResponseEntity<CommonResponse<RiskActionResult>> blockRiskTransaction(
            @PathVariable String transactionId) {
        RiskActionResult result = riskTransactionService.block(transactionId);
        return ResponseEntity.ok(new CommonResponse<>("success", result, "위험 거래 차단 성공"));
    }
}
