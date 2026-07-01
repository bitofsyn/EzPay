package com.example.ezpay.modules.realtime.websocket;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

// /ws/admin-events 로 연결된 세션을 관리하고 프론트엔드(realtimeApi.ts)로 브로드캐스트하는 핸들러.
// 프론트엔드는 topic 구독 메시지를 보내지 않고 수신한 모든 메시지를 message.topic 값으로 클라이언트에서 필터링하므로,
// 서버는 연결된 모든 세션에 메시지를 전송한다.
@Slf4j
@Component
public class AdminWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();
    private final Set<WebSocketSession> sessions = ConcurrentHashMap.newKeySet();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.add(session);
        log.info("WebSocket 연결: {} (총 {}건)", session.getId(), sessions.size());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws IOException {
        try {
            Map<String, Object> request = objectMapper.readValue(message.getPayload(), new TypeReference<>() {});
            String action = String.valueOf(request.get("action"));

            if ("ping".equals(action)) {
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(Map.of("event", "pong"))));
            }
        } catch (Exception e) {
            log.warn("WebSocket 메시지 처리 실패: {}", e.getMessage());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session);
        log.info("WebSocket 연결 종료: {} - {} (총 {}건)", session.getId(), status.getReason(), sessions.size());
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        log.error("WebSocket 오류 (session={}): {}", session.getId(), exception.getMessage());
    }

    public void broadcast(String topic, Object data) {
        Map<String, Object> message = Map.of(
                "topic", topic,
                "data", data,
                "timestamp", LocalDateTime.now()
        );

        String payload;
        try {
            payload = objectMapper.writeValueAsString(message);
        } catch (IOException e) {
            log.error("WebSocket 메시지 직렬화 실패: {}", e.getMessage());
            return;
        }

        TextMessage textMessage = new TextMessage(payload);
        for (WebSocketSession session : sessions) {
            if (session.isOpen()) {
                try {
                    session.sendMessage(textMessage);
                } catch (IOException e) {
                    log.error("WebSocket 전송 실패 (session={}): {}", session.getId(), e.getMessage());
                }
            }
        }
    }
}
