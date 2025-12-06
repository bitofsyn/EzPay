package com.example.ezpay.controller.auth;

import com.example.ezpay.modules.auth.api.dto.*;
import com.example.ezpay.modules.auth.api.facade.AuthFacade;
import com.example.ezpay.shared.common.dto.CommonResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class AuthController {

    private final AuthFacade authFacade;

    /**
     * 회원가입
     */
    @PostMapping("/signup")
    public ResponseEntity<CommonResponse<RegisterResponse>> signup(@RequestBody RegisterRequest request) {
        RegisterResponse response = authFacade.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new CommonResponse<>("success", response, "회원가입이 완료되었습니다."));
    }

    /**
     * 로그인
     */
    @PostMapping("/login")
    public ResponseEntity<CommonResponse<LoginResponse>> login(
            @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {

        String ip = extractClientIp(httpRequest);
        String device = parseDeviceInfo(httpRequest);

        LoginResponse response = authFacade.login(request, ip, device);

        return ResponseEntity.ok(new CommonResponse<>("success", response, "로그인 성공"));
    }

    /**
     * 이메일 찾기
     */
    @PostMapping("/find-email")
    public ResponseEntity<CommonResponse<FindEmailResponse>> findEmail(@RequestBody FindEmailRequest request) {
        FindEmailResponse response = authFacade.findEmailByPhoneAndName(request);
        return ResponseEntity.ok(new CommonResponse<>("success", response, "이메일 찾기 성공"));
    }

    /**
     * 클라이언트 IP 추출
     */
    private String extractClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }

    /**
     * 디바이스 정보 파싱
     */
    private String parseDeviceInfo(HttpServletRequest request) {
        String userAgent = request.getHeader("User-Agent");

        if (userAgent == null) return "Unknown";

        if (userAgent.contains("Windows")) return "Windows PC";
        if (userAgent.contains("Macintosh")) return "Mac";
        if (userAgent.contains("iPhone")) return "iPhone";
        if (userAgent.contains("Android")) return "Android";
        if (userAgent.contains("Linux")) return "Linux";

        return "기타 브라우저";
    }
}
