package com.example.ezpay.controller.user;

import com.example.ezpay.modules.bankconnector.api.dto.*;
import com.example.ezpay.modules.bankconnector.internal.service.FinancialConnectionService;
import com.example.ezpay.model.user.FinancialConnection;
import com.example.ezpay.shared.common.dto.CommonResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class FinancialConnectionController {
    private final FinancialConnectionService financialConnectionService;

    @PostMapping("/connections/link-token")
    public ResponseEntity<CommonResponse<ConnectionLinkToken>> createLinkToken(@RequestBody LinkTokenRequest request) {
        ConnectionLinkToken response = financialConnectionService.createLinkToken(
                request.getUserId(),
                request.getProvider().name()
        );
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new CommonResponse<>("success", response, "LINK_TOKEN_CREATED"));
    }

    @PostMapping("/connections/exchange")
    public ResponseEntity<CommonResponse<ConnectionExchangeResult>> exchangeConnection(@RequestBody ExchangeConnectionRequest request) {
        ConnectionExchangeResult response = financialConnectionService.exchangeConnection(
                request.getUserId(),
                request.getProvider().name(),
                request.getPublicToken()
        );
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new CommonResponse<>("success", response, "CONNECTION_CREATED"));
    }

    @GetMapping("/connections/{userId}")
    public ResponseEntity<CommonResponse<List<FinancialConnection>>> getConnections(@PathVariable Long userId) {
        List<FinancialConnection> connections = financialConnectionService.getConnections(userId);
        return ResponseEntity.ok(new CommonResponse<>("success", connections, "CONNECTIONS_FETCHED"));
    }

    @PostMapping("/transactions/sync")
    public ResponseEntity<CommonResponse<TransactionSyncResult>> syncTransactions(@RequestBody SyncTransactionsRequest request) {
        TransactionSyncResult result = financialConnectionService.syncTransactions(request);
        return ResponseEntity.ok(new CommonResponse<>("success", result, "TRANSACTIONS_SYNCED"));
    }

    @PostMapping("/connections/sample-import")
    public ResponseEntity<CommonResponse<TransactionSyncResult>> importSampleTransactions(@RequestBody SampleImportRequest request) {
        TransactionSyncResult result = financialConnectionService.importSampleTransactions(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new CommonResponse<>("success", result, "SAMPLE_TRANSACTIONS_IMPORTED"));
    }
}
