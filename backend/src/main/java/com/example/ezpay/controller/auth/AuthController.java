package com.example.ezpay.controller.auth;

import com.example.ezpay.modules.auth.api.dto.*;
import com.example.ezpay.modules.auth.api.facade.AuthFacade;
import com.example.ezpay.modules.systemlog.service.SystemLogger;
import com.example.ezpay.shared.common.dto.CommonResponse;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class AuthController {

    private static final String LOG_SERVICE = "AuthService";

    private final AuthFacade authFacade;
    private final SystemLogger systemLogger;

    /**
     * 회원가입
     */
    @PostMapping("/signup")
    public ResponseEntity<CommonResponse<RegisterResponse>> signup(@Valid @RequestBody RegisterRequest request) {
        RegisterResponse response = authFacade.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new CommonResponse<>("success", response, "회원가입이 완료되었습니다."));
    }

    /**
     * 로그인
     */
    @PostMapping("/login")
    public ResponseEntity<CommonResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        String ip = extractClientIp(httpRequest);
        String device = parseDeviceInfo(httpRequest);

        LoginResponse response = authFacade.login(request, ip, device);

        // JWT를 httpOnly 쿠키로 설정
        Cookie jwtCookie = new Cookie("jwt", response.getToken());
        jwtCookie.setHttpOnly(true);
        jwtCookie.setSecure(false); // 개발 환경에서는 false, 프로덕션에서는 true
        jwtCookie.setPath("/");
        jwtCookie.setMaxAge(7 * 24 * 60 * 60); // 7일
        httpResponse.addCookie(jwtCookie);

        return ResponseEntity.ok(new CommonResponse<>("success", response, "로그인 성공"));
    }

    /**
     * 로그아웃
     */
    @PostMapping("/logout")
    public ResponseEntity<CommonResponse<Void>> logout(HttpServletResponse httpResponse) {
        // JWT 쿠키 삭제
        Cookie jwtCookie = new Cookie("jwt", null);
        jwtCookie.setHttpOnly(true);
        jwtCookie.setSecure(false);
        jwtCookie.setPath("/");
        jwtCookie.setMaxAge(0); // 즉시 만료
        httpResponse.addCookie(jwtCookie);

        // 시스템 로그: 로그아웃(INFO). JWT 필터가 세팅한 인증 주체(email)를 읽어 기록한다.
        systemLogger.info(LOG_SERVICE, "로그아웃: " + currentUser());

        return ResponseEntity.ok(new CommonResponse<>("success", null, "로그아웃 성공"));
    }

    // 현재 인증된 사용자 식별자(email)를 반환한다. 토큰이 없거나 익명이면 "알 수 없음".
    private String currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return "알 수 없음";
        }
        return auth.getName();
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
