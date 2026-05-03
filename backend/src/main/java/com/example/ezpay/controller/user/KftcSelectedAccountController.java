package com.example.ezpay.controller.user;

import com.example.ezpay.modules.bankconnector.api.dto.KftcSelectedAccountRequest;
import com.example.ezpay.modules.bankconnector.api.dto.KftcSelectedAccountResult;
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
public class KftcSelectedAccountController {
    private final FinancialConnectionService financialConnectionService;

    @PostMapping("/selected-account")
    public ResponseEntity<CommonResponse<KftcSelectedAccountResult>> selectedAccount(@RequestBody KftcSelectedAccountRequest request) {
        KftcSelectedAccountResult result = financialConnectionService.saveKftcSelectedAccount(request);
        return ResponseEntity.ok(new CommonResponse<>("success", result, "KFTC_SELECTED_ACCOUNT_STORED"));
    }
}
