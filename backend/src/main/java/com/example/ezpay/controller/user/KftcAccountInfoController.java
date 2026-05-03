package com.example.ezpay.controller.user;

import com.example.ezpay.modules.bankconnector.api.dto.KftcAccountInfoRequest;
import com.example.ezpay.modules.bankconnector.api.dto.KftcAccountInfoResponse;
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
public class KftcAccountInfoController {
    private final FinancialConnectionService financialConnectionService;

    @PostMapping("/account-info")
    public ResponseEntity<CommonResponse<KftcAccountInfoResponse>> accountInfo(@RequestBody KftcAccountInfoRequest request) {
        KftcAccountInfoResponse result = financialConnectionService.listKftcAccounts(request);
        return ResponseEntity.ok(new CommonResponse<>("success", result, "KFTC_ACCOUNT_INFO_FETCHED"));
    }
}
