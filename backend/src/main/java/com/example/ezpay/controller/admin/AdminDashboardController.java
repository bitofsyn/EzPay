package com.example.ezpay.controller.admin;

import com.example.ezpay.modules.admin.api.dto.AdminDashboardInfo;
import com.example.ezpay.modules.admin.api.dto.DailyTransactionStats;
import com.example.ezpay.modules.admin.api.dto.HourlyTransactionStats;
import com.example.ezpay.modules.admin.api.dto.RecentActivityLog;
import com.example.ezpay.modules.admin.internal.service.AdminService;
import com.example.ezpay.shared.common.dto.CommonResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    // 주간 거래 추이 (최근 7일)
    @GetMapping("/weekly-trend")
    public ResponseEntity<CommonResponse<List<DailyTransactionStats>>> getWeeklyTransactionTrend() {
        List<DailyTransactionStats> trend = adminService.getWeeklyTransactionTrend();
        return ResponseEntity.ok(new CommonResponse<>("success", trend, "주간 거래 추이 조회 성공"));
    }

    // 시간대별 거래량 (오늘)
    @GetMapping("/hourly-transactions")
    public ResponseEntity<CommonResponse<List<HourlyTransactionStats>>> getTodayHourlyTransactions() {
        List<HourlyTransactionStats> hourlyStats = adminService.getTodayHourlyTransactions();
        return ResponseEntity.ok(new CommonResponse<>("success", hourlyStats, "시간대별 거래량 조회 성공"));
    }

    // 최근 활동 로그
    @GetMapping("/recent-activities")
    public ResponseEntity<CommonResponse<List<RecentActivityLog>>> getRecentActivities(
            @RequestParam(defaultValue = "50") int limit) {
        List<RecentActivityLog> activities = adminService.getRecentActivities(limit);
        return ResponseEntity.ok(new CommonResponse<>("success", activities, "최근 활동 조회 성공"));
    }
}
