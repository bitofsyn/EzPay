package com.example.ezpay.controller.admin;

import com.example.ezpay.modules.admin.api.dto.AdminDashboardInfo;
import com.example.ezpay.modules.admin.internal.service.AdminService;
import com.example.ezpay.shared.common.dto.CommonResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {
    private final AdminService adminService;

    // Admin 대시보드 통계 조회
    @GetMapping
    public ResponseEntity<CommonResponse<AdminDashboardInfo>> getDashboardStats() {
        AdminDashboardInfo stats = adminService.getDashboardStats();
        return ResponseEntity.ok(new CommonResponse<>("success", stats, "대시보드 통계 조회 성공"));
    }
}
