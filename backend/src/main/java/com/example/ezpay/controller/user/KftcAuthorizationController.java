package com.example.ezpay.controller.user;

import com.example.ezpay.modules.bankconnector.api.dto.KftcAuthorizationCallbackResult;
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
public class KftcAuthorizationController {
    private final FinancialConnectionService financialConnectionService;

    @GetMapping("/callback")
    public ResponseEntity<CommonResponse<KftcAuthorizationCallbackResult>> callback(
            @RequestParam(required = false) Long userId,
            @RequestParam String code,
            @RequestParam(required = false) String state
    ) {
        KftcAuthorizationCallbackResult result = financialConnectionService.handleKftcAuthorizationCallback(
                resolveUserId(userId, state),
                code,
                state
        );
        return ResponseEntity.ok(new CommonResponse<>("success", result, "KFTC_AUTH_CODE_STORED"));
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
