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

    // 실제 송금 처리 서비스가 발행하는 단계 전이 이벤트를 관리자 화면에 전달한다.
    @GetMapping("/transaction-pipeline")
    public SseEmitter streamTransactionPipeline() {
        return sseEmitterRegistry.register("transaction-pipeline");
    }

    // 사용자 상태 변경 등 사용자 도메인 실시간 이벤트 스트림.
    // 관리자 사용자 관리 뷰(useSseChannel)가 구독해 해당 사용자 행을 즉시 갱신한다.
    @GetMapping("/user-events")
    public SseEmitter streamUserEvents() {
        return sseEmitterRegistry.register("user-events");
    }
}
