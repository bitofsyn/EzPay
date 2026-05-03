package com.example.ezpay.controller.user;

import com.example.ezpay.modules.bankconnector.api.dto.KftcAccountRegistrationCallbackRequest;
import com.example.ezpay.modules.bankconnector.api.dto.KftcAccountRegistrationCallbackResult;
import com.example.ezpay.modules.bankconnector.internal.service.FinancialConnectionService;
import com.example.ezpay.shared.common.dto.CommonResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/connections/kftc")
@RequiredArgsConstructor
public class KftcAccountRegistrationController {
    private final FinancialConnectionService financialConnectionService;

    @GetMapping("/account-registration/callback")
    public ResponseEntity<CommonResponse<KftcAccountRegistrationCallbackResult>> callback(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String fintechUseNum,
            @RequestParam(required = false) String bankCodeStd,
            @RequestParam(required = false) String accountNum,
            @RequestParam(required = false) String accountSeq,
            @RequestParam(required = false) String accountName,
            @RequestParam(required = false) String accountLocalCode
    ) {
        KftcAccountRegistrationCallbackRequest request = new KftcAccountRegistrationCallbackRequest();
        request.setUserId(resolveUserId(userId, state));
        request.setCode(code);
        request.setState(state);
        request.setFintechUseNum(fintechUseNum);
        request.setBankCodeStd(bankCodeStd);
        request.setAccountNum(accountNum);
        request.setAccountSeq(accountSeq);
        request.setAccountName(accountName);
        request.setAccountLocalCode(accountLocalCode);

        KftcAccountRegistrationCallbackResult result = financialConnectionService.handleKftcAccountRegistrationCallback(request);
        return ResponseEntity.ok(new CommonResponse<>("success", result, "KFTC_ACCOUNT_REGISTRATION_STORED"));
    }

    private Long resolveUserId(Long userId, String state) {
        if (userId != null) {
            return userId;
        }
        if (state == null || state.isBlank()) {
            throw new IllegalArgumentException("KFTC callback에 userId 또는 state가 필요합니다.");
        }
        String prefix = "kftc-user-";
        if (!state.startsWith(prefix)) {
            throw new IllegalArgumentException("KFTC state 형식이 올바르지 않습니다.");
        }
        try {
            return Long.parseLong(state.substring(prefix.length()));
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("KFTC state에서 userId를 해석할 수 없습니다.");
        }
    }
}
