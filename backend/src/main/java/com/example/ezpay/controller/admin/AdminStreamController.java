package com.example.ezpay.controller.admin;

import com.example.ezpay.modules.realtime.sse.SseEmitterRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

// 프론트엔드 logsApi.ts / metricsApi.ts가 구독하는 SSE 스트림 엔드포인트
@RestController
@RequestMapping("/admin/stream")
@RequiredArgsConstructor
public class AdminStreamController {

    private final SseEmitterRegistry sseEmitterRegistry;

    @GetMapping("/system-logs")
    public SseEmitter streamSystemLogs() {
        return sseEmitterRegistry.register("system-logs");
    }

    @GetMapping("/tps-metrics")
    public SseEmitter streamTPSMetrics() {
        return sseEmitterRegistry.register("tps-metrics");
    }

    @GetMapping("/activities")
    public SseEmitter streamActivities() {
        return sseEmitterRegistry.register("activities");
    }
}
