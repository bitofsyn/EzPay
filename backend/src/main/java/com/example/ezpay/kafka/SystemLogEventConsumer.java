package com.example.ezpay.kafka;

import com.example.ezpay.modules.systemlog.entity.LogLevel;
import com.example.ezpay.modules.systemlog.entity.SystemLog;
import com.example.ezpay.modules.systemlog.service.SystemLogService;
import com.example.ezpay.shared.messaging.config.KafkaConfig;
import com.example.ezpay.shared.messaging.events.SystemLogEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "ezpay.kafka.enabled", havingValue = "true", matchIfMissing = true)
public class SystemLogEventConsumer {

    private final SystemLogService systemLogService;

    @KafkaListener(
            topics = KafkaConfig.SYSTEM_LOG_EVENTS_TOPIC,
            groupId = "admin-dashboard-consumer",
            containerFactory = "kafkaListenerContainerFactory",
            autoStartup = "${spring.kafka.listener.auto-startup:false}"
    )
    public void consumeLogEvent(SystemLogEvent event, Acknowledgment ack) {
        log.info("시스템 로그 이벤트 수신: {}", event);

        SystemLog systemLog = SystemLog.builder()
                .logTime(event.getOccurredAt() != null ? event.getOccurredAt() : LocalDateTime.now())
                .level(LogLevel.valueOf(event.getLevel()))
                .service(event.getService())
                .message(event.getMessage())
                .build();

        systemLogService.save(systemLog);
        ack.acknowledge();
    }
}
