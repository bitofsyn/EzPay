package com.example.ezpay.controller.user;

import com.example.ezpay.modules.bankconnector.api.dto.NormalizedTransactionResponse;
import com.example.ezpay.modules.bankconnector.internal.service.NormalizedTransactionQueryService;
import com.example.ezpay.shared.common.dto.CommonResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/normalized-transactions")
@RequiredArgsConstructor
public class NormalizedTransactionController {
    private final NormalizedTransactionQueryService normalizedTransactionQueryService;

    @GetMapping
    public ResponseEntity<CommonResponse<List<NormalizedTransactionResponse>>> getTransactions(
            @RequestParam Long userId,
            @RequestParam(required = false) Long connectionId) {
        List<NormalizedTransactionResponse> response = normalizedTransactionQueryService.getTransactions(userId, connectionId);
        return ResponseEntity.ok(new CommonResponse<>("success", response, "NORMALIZED_TRANSACTIONS_FETCHED"));
    }

    @GetMapping("/recent")
    public ResponseEntity<CommonResponse<List<NormalizedTransactionResponse>>> getRecentTransactions(
            @RequestParam Long userId,
            @RequestParam(defaultValue = "5") int limit) {
        List<NormalizedTransactionResponse> response = normalizedTransactionQueryService.getRecentTransactions(userId, limit);
        return ResponseEntity.ok(new CommonResponse<>("success", response, "NORMALIZED_RECENT_TRANSACTIONS_FETCHED"));
    }
}
