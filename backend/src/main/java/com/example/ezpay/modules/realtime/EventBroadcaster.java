package com.example.ezpay.modules.realtime;

import com.example.ezpay.modules.realtime.sse.SseEmitterRegistry;
import com.example.ezpay.modules.realtime.websocket.AdminWebSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

// 위험거래/로그/메트릭 이벤트를 SSE 채널 또는 WebSocket 토픽으로 전송하는 단일 진입점
@Component
@RequiredArgsConstructor
public class EventBroadcaster {

    private final SseEmitterRegistry sseEmitterRegistry;
    private final AdminWebSocketHandler adminWebSocketHandler;

    public void broadcastToSse(String channel, Object data) {
        sseEmitterRegistry.broadcast(channel, data);
    }

    public void broadcastToTopic(String topic, Object data) {
        adminWebSocketHandler.broadcast(topic, data);
    }
}
