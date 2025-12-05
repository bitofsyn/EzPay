package com.example.ezpay.controller.user;

import com.example.ezpay.modules.auth.api.dto.PasswordResetRequest;
import com.example.ezpay.modules.auth.api.facade.AuthFacade;
import com.example.ezpay.shared.common.dto.CommonResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/password-reset")
@RequiredArgsConstructor
public class PasswordRequestController {
    private final AuthFacade authFacade;

    // 비밀번호 재설정 요청 생성
    @PostMapping("/request")
    public ResponseEntity<CommonResponse<String>> requestPasswordReset(@RequestBody PasswordResetRequest passwordResetRequest) {
        authFacade.initiatePasswordReset(passwordResetRequest.getEmail());
        return ResponseEntity.ok(new CommonResponse<>("success", null, "비밀번호 재설정 요청이 완료되었습니다. 30분 내에 비밀번호를 변경해주세요."));
    }


    // 토큰 유효성 검증
    @GetMapping("/validate")
    public ResponseEntity<CommonResponse<String>> validatePasswordResetToken(@RequestParam("token") String token) {
        try {
            boolean valid = authFacade.verifyResetToken(token);

            if (valid) {
                return ResponseEntity.ok(new CommonResponse<>("success", "토큰이 유효합니다.", "VALID TOKEN"));
            } else {
                return ResponseEntity.status(401).body(new CommonResponse<>("error", "토큰이 만료되었거나 유효하지 않습니다.", "INVALID TOKEN"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(400).body(new CommonResponse<>("error", e.getMessage(), "TOKEN ERROR"));
        }
    }

    // 새 비밀번호로 변경
    @PutMapping("/reset-password")
    public ResponseEntity<CommonResponse<String>> confirmPasswordReset(@RequestHeader("Authorization") String tokenHeader,
                                                                       @RequestParam String newPassword) {
        String token = tokenHeader.replace("Bearer ", "");
        authFacade.resetPassword(token, newPassword);
        return ResponseEntity.ok(new CommonResponse<>("success", "비밀번호 재설정 완료", "PASSWORD RESET SUCCESS"));
    }
}
