package com.example.ezpay.controller.user;

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
public class KftcFintechUseNumController {
    private final FinancialConnectionService financialConnectionService;

    public record FintechUseNumRequest(Long userId, String fintechUseNum) {}

    @PostMapping("/fintech-use-num")
    public ResponseEntity<CommonResponse<KftcTokenExchangeCallbackResult>> saveFintechUseNum(
            @RequestBody FintechUseNumRequest request
    ) {
        KftcTokenExchangeCallbackResult result = financialConnectionService.saveKftcFintechUseNum(
                request.userId(),
                request.fintechUseNum()
        );
        return ResponseEntity.ok(new CommonResponse<>("success", result, "KFTC_FINTECH_USE_NUM_STORED"));
    }
}
