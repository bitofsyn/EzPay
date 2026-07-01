package com.example.ezpay.modules.realtime.websocket;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

// 프론트엔드 realtimeApi.ts가 연결하는 ws://.../ws/admin-events 엔드포인트 등록
@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {

    private final AdminWebSocketHandler adminWebSocketHandler;

    // 기본값을 application.yml의 app.cors.allowed-origins 및 SecurityConfig와 동일하게 유지(Vite 5173 포함).
    // 프로퍼티 미로드 시에도 REST/SSE와 WebSocket 간 CORS 허용 오리진이 비대칭이 되지 않도록 정합.
    @Value("${app.cors.allowed-origins:http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173}")
    private String allowedOrigins;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry
                .addHandler(adminWebSocketHandler, "/ws/admin-events")
                .setAllowedOrigins(allowedOrigins.split(","));
    }
}
