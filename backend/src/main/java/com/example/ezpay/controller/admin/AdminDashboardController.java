package com.example.ezpay.controller.admin;

import com.example.ezpay.modules.admin.api.dto.*;
import com.example.ezpay.modules.admin.internal.service.AdminService;
import com.example.ezpay.shared.common.dto.CommonResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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

    // 대시보드 메트릭 조회 (관리자 대시보드 실시간 카드용)
    @GetMapping("/metrics")
    public ResponseEntity<CommonResponse<DashboardMetricsInfo>> getDashboardMetrics() {
        DashboardMetricsInfo metrics = adminService.getDashboardMetrics();
        return ResponseEntity.ok(new CommonResponse<>("success", metrics, "대시보드 메트릭 조회 성공"));
    }

    // TPS 메트릭 조회
    @GetMapping("/tps-metrics")
    public ResponseEntity<CommonResponse<TPSMetricsInfo>> getTPSMetrics() {
        TPSMetricsInfo metrics = adminService.getTPSMetrics();
        return ResponseEntity.ok(new CommonResponse<>("success", metrics, "TPS 메트릭 조회 성공"));
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

    // ========== 관리자 알림 ==========

    // 모든 알림 조회
    @GetMapping("/alerts")
    public ResponseEntity<CommonResponse<List<AdminAlertInfo>>> getAllAlerts() {
        List<AdminAlertInfo> alerts = adminService.getAllAlerts();
        return ResponseEntity.ok(new CommonResponse<>("success", alerts, "알림 조회 성공"));
    }

    // 읽지 않은 알림 개수
    @GetMapping("/alerts/unread-count")
    public ResponseEntity<CommonResponse<Map<String, Long>>> getUnreadAlertCount() {
        long count = adminService.getUnreadAlertCount();
        return ResponseEntity.ok(new CommonResponse<>("success", Map.of("count", count), "읽지 않은 알림 개수 조회 성공"));
    }

    // 알림 읽음 처리
    @PutMapping("/alerts/{alertId}/read")
    public ResponseEntity<CommonResponse<Void>> markAlertAsRead(@PathVariable Long alertId) {
        adminService.markAlertAsRead(alertId);
        return ResponseEntity.ok(new CommonResponse<>("success", null, "알림 읽음 처리 성공"));
    }

    // 모든 알림 읽음 처리
    @PutMapping("/alerts/read-all")
    public ResponseEntity<CommonResponse<Void>> markAllAlertsAsRead() {
        adminService.markAllAlertsAsRead();
        return ResponseEntity.ok(new CommonResponse<>("success", null, "모든 알림 읽음 처리 성공"));
    }

    // ========== 관리자 메시지 ==========

    // 모든 메시지 조회
    @GetMapping("/messages")
    public ResponseEntity<CommonResponse<List<AdminMessageInfo>>> getAllMessages() {
        List<AdminMessageInfo> messages = adminService.getAllMessages();
        return ResponseEntity.ok(new CommonResponse<>("success", messages, "메시지 조회 성공"));
    }

    // 읽지 않은 메시지 개수
    @GetMapping("/messages/unread-count")
    public ResponseEntity<CommonResponse<Map<String, Long>>> getUnreadMessageCount() {
        long count = adminService.getUnreadMessageCount();
        return ResponseEntity.ok(new CommonResponse<>("success", Map.of("count", count), "읽지 않은 메시지 개수 조회 성공"));
    }

    // 메시지 읽음 처리
    @PutMapping("/messages/{messageId}/read")
    public ResponseEntity<CommonResponse<Void>> markMessageAsRead(@PathVariable Long messageId) {
        adminService.markMessageAsRead(messageId);
        return ResponseEntity.ok(new CommonResponse<>("success", null, "메시지 읽음 처리 성공"));
    }

    // 모든 메시지 읽음 처리
    @PutMapping("/messages/read-all")
    public ResponseEntity<CommonResponse<Void>> markAllMessagesAsRead() {
        adminService.markAllMessagesAsRead();
        return ResponseEntity.ok(new CommonResponse<>("success", null, "모든 메시지 읽음 처리 성공"));
    }
}
