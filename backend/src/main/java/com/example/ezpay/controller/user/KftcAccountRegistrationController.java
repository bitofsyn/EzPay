package com.example.ezpay.controller.user;

import com.example.ezpay.modules.bankconnector.api.dto.KftcAccountRegistrationCallbackRequest;
import com.example.ezpay.modules.bankconnector.api.dto.KftcAccountRegistrationCallbackResult;
import com.example.ezpay.modules.bankconnector.internal.service.FinancialConnectionService;
import com.example.ezpay.shared.common.dto.CommonResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/connections/kftc")
@RequiredArgsConstructor
@Slf4j
public class KftcAccountRegistrationController {
    private static final String AUTH_STATE_PREFIX = "kftc";
    private static final int AUTH_STATE_USER_ID_START = 4;
    private static final int AUTH_STATE_USER_ID_END = 14;
    private final FinancialConnectionService financialConnectionService;

    @GetMapping("/account-registration/callback")
    public ResponseEntity<CommonResponse<KftcAccountRegistrationCallbackResult>> callback(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String state,
            @RequestParam Map<String, String> params
    ) {
        log.info("KFTC account-registration callback params: {}", params);

        KftcAccountRegistrationCallbackRequest request = new KftcAccountRegistrationCallbackRequest();
        request.setUserId(resolveUserId(userId, state));
        request.setCode(code);
        request.setState(state);
        request.setFintechUseNum(firstNonBlank(params.get("fintech_use_num"), params.get("fintechUseNum")));
        request.setBankCodeStd(firstNonBlank(params.get("bank_code_std"), params.get("bankCodeStd")));
        request.setAccountNum(firstNonBlank(params.get("account_num"), params.get("accountNum")));
        request.setAccountSeq(firstNonBlank(params.get("account_seq"), params.get("accountSeq")));
        request.setAccountName(firstNonBlank(
                params.get("account_name"),
                params.get("accountName"),
                params.get("account_holder_name"),
                params.get("accountHolderName"),
                params.get("product_name"),
                params.get("productName")
        ));
        request.setAccountLocalCode(firstNonBlank(params.get("account_local_code"), params.get("accountLocalCode")));

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
        if (state.length() < AUTH_STATE_USER_ID_END || !state.startsWith(AUTH_STATE_PREFIX)) {
            throw new IllegalArgumentException("KFTC state 형식이 올바르지 않습니다.");
        }
        try {
            return Long.parseLong(state.substring(AUTH_STATE_USER_ID_START, AUTH_STATE_USER_ID_END));
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("KFTC state에서 userId를 해석할 수 없습니다.");
        }
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }
}
