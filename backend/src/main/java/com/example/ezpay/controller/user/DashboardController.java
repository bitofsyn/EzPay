package com.example.ezpay.controller.user;

import com.example.ezpay.response.CommonResponse;
import com.example.ezpay.response.DashboardResponse;
import com.example.ezpay.service.user.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    public ResponseEntity<CommonResponse<DashboardResponse>> getDashboardInfo(Authentication authentication) {
        DashboardResponse response = dashboardService.getDashboardInfo(authentication);
        return ResponseEntity.ok(new CommonResponse<>("success", response, "사용자 정보 조회 성공 "));
    }
}
