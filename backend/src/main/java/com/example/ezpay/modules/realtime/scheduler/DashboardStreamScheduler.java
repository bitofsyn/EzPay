package com.example.ezpay.modules.realtime.scheduler;

import com.example.ezpay.modules.admin.api.dto.RecentActivityLog;
import com.example.ezpay.modules.admin.internal.service.AdminService;
import com.example.ezpay.modules.realtime.EventBroadcaster;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

// TPS 메트릭과 최근 활동을 주기적으로 SSE(metricsApi.ts)로 브로드캐스트
@Slf4j
@Component
@RequiredArgsConstructor
public class DashboardStreamScheduler {

    private static final String SSE_CHANNEL_TPS_METRICS = "tps-metrics";
    private static final String SSE_CHANNEL_ACTIVITIES = "activities";

    private final AdminService adminService;
    private final EventBroadcaster eventBroadcaster;

    private volatile LocalDateTime lastBroadcastActivityTimestamp;

    @Scheduled(fixedRate = 3000)
    public void broadcastTpsMetrics() {
        try {
            eventBroadcaster.broadcastToSse(SSE_CHANNEL_TPS_METRICS, adminService.getTPSMetrics());
        } catch (Exception e) {
            log.error("TPS 메트릭 브로드캐스트 실패: {}", e.getMessage());
        }
    }

    @Scheduled(fixedRate = 5000)
    public void broadcastRecentActivity() {
        try {
            List<RecentActivityLog> activities = adminService.getRecentActivities(1);
            if (activities.isEmpty()) {
                return;
            }

            RecentActivityLog latest = activities.get(0);
            if (latest.getTimestamp() != null && latest.getTimestamp().equals(lastBroadcastActivityTimestamp)) {
                return;
            }

            lastBroadcastActivityTimestamp = latest.getTimestamp();
            eventBroadcaster.broadcastToSse(SSE_CHANNEL_ACTIVITIES, latest);
        } catch (Exception e) {
            log.error("활동 로그 브로드캐스트 실패: {}", e.getMessage());
        }
    }
}
