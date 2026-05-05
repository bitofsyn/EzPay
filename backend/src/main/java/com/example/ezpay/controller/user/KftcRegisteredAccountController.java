package com.example.ezpay.controller.user;

import com.example.ezpay.modules.bankconnector.api.dto.KftcRegisteredAccountRequest;
import com.example.ezpay.modules.bankconnector.api.dto.KftcRegisteredAccountResponse;
import com.example.ezpay.modules.bankconnector.api.dto.KftcRegisteredAccountSelectionRequest;
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
public class KftcRegisteredAccountController {
    private final FinancialConnectionService financialConnectionService;

    @PostMapping("/registered-accounts")
    public ResponseEntity<CommonResponse<KftcRegisteredAccountResponse>> registeredAccounts(
            @RequestBody KftcRegisteredAccountRequest request
    ) {
        KftcRegisteredAccountResponse result = financialConnectionService.listKftcRegisteredAccounts(request);
        return ResponseEntity.ok(new CommonResponse<>("success", result, "KFTC_REGISTERED_ACCOUNTS_FETCHED"));
    }

    @PostMapping("/registered-account/select")
    public ResponseEntity<CommonResponse<KftcSelectedAccountResult>> selectRegisteredAccount(
            @RequestBody KftcRegisteredAccountSelectionRequest request
    ) {
        KftcSelectedAccountResult result = financialConnectionService.saveKftcRegisteredAccountSelection(request);
        return ResponseEntity.ok(new CommonResponse<>("success", result, "KFTC_REGISTERED_ACCOUNT_SELECTED"));
    }
}
