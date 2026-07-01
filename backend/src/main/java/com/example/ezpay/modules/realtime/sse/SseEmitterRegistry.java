package com.example.ezpay.modules.realtime.sse;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

// 채널(system-logs, tps-metrics, activities)별로 SseEmitter를 관리하고 브로드캐스트하는 컴포넌트
@Slf4j
@Component
public class SseEmitterRegistry {

    private static final long TIMEOUT_MS = 300_000L; // 5분

    private final Map<String, Set<SseEmitter>> channelEmitters = new ConcurrentHashMap<>();
    private final AtomicLong eventIdSequence = new AtomicLong(0);

    public SseEmitter register(String channel) {
        SseEmitter emitter = new SseEmitter(TIMEOUT_MS);
        Set<SseEmitter> emitters = channelEmitters.computeIfAbsent(channel, k -> ConcurrentHashMap.newKeySet());
        emitters.add(emitter);

        emitter.onCompletion(() -> remove(channel, emitter));
        emitter.onTimeout(() -> remove(channel, emitter));
        emitter.onError(e -> remove(channel, emitter));

        try {
            emitter.send(SseEmitter.event()
                    .id(String.valueOf(eventIdSequence.incrementAndGet()))
                    .name("connect")
                    .data("connected"));
        } catch (IOException e) {
            remove(channel, emitter);
        }

        return emitter;
    }

    // 프론트엔드(logsApi.ts/metricsApi.ts)는 EventSource.onmessage만 사용하므로
    // 커스텀 이벤트 이름을 지정하지 않고 기본 "message" 이벤트로 전송해야 한다.
    public void broadcast(String channel, Object data) {
        Set<SseEmitter> emitters = channelEmitters.get(channel);
        if (emitters == null || emitters.isEmpty()) {
            return;
        }

        for (SseEmitter emitter : Set.copyOf(emitters)) {
            try {
                emitter.send(SseEmitter.event()
                        .id(String.valueOf(eventIdSequence.incrementAndGet()))
                        .data(data));
            } catch (IOException | IllegalStateException e) {
                remove(channel, emitter);
            }
        }
    }

    private void remove(String channel, SseEmitter emitter) {
        Set<SseEmitter> emitters = channelEmitters.get(channel);
        if (emitters != null) {
            emitters.remove(emitter);
        }
    }
}
