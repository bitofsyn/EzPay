package com.example.ezpay.controller.user;

import com.example.ezpay.modules.bankconnector.api.dto.KftcTokenExchangeCallbackRequest;
import com.example.ezpay.modules.bankconnector.api.dto.KftcTokenExchangeCallbackResult;
import com.example.ezpay.modules.bankconnector.internal.service.FinancialConnectionService;
import com.example.ezpay.shared.common.dto.CommonResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/connections/kftc")
@RequiredArgsConstructor
public class KftcTokenExchangeController {
    private final FinancialConnectionService financialConnectionService;

    @PostMapping("/token-exchange")
    public ResponseEntity<CommonResponse<KftcTokenExchangeCallbackResult>> tokenExchange(
            @RequestBody KftcTokenExchangeCallbackRequest request
    ) {
        KftcTokenExchangeCallbackResult result = financialConnectionService.handleKftcTokenExchangeCallback(request);
        return ResponseEntity.ok(new CommonResponse<>("success", result, "KFTC_TOKEN_EXCHANGE_STORED"));
    }
}
