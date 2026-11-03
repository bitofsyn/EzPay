package com.example.ezpay.modules.kafka.service;

import com.example.ezpay.modules.kafka.dto.FailedEventInfo;
import com.example.ezpay.modules.kafka.entity.FailedEventLog;
import com.example.ezpay.modules.kafka.repository.FailedEventLogRepository;
import com.example.ezpay.shared.exception.CustomNotFoundException;
import com.example.ezpay.shared.messaging.config.KafkaConfig;
import com.example.ezpay.shared.messaging.events.RiskDetectionEvent;
import com.example.ezpay.shared.messaging.events.SystemLogEvent;
import com.example.ezpay.shared.messaging.events.TransferEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
@ConditionalOnProperty(name = "ezpay.kafka.enabled", havingValue = "true")
public class FailedEventRetryService {

    private final FailedEventLogRepository repository;
    private final ObjectMapper objectMapper;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public FailedEventRetryService(
            FailedEventLogRepository repository,
            ObjectMapper objectMapper,
            @Qualifier("objectKafkaTemplate") KafkaTemplate<String, Object> kafkaTemplate) {
        this.repository = repository;
        this.objectMapper = objectMapper;
        this.kafkaTemplate = kafkaTemplate;
    }

    @Transactional(readOnly = true)
    public List<FailedEventInfo> getFailedEvents() {
        return repository.findAllByOrderByOccurredAtDesc().stream()
                .map(FailedEventInfo::from)
                .toList();
    }

    @Transactional
    public FailedEventInfo retry(Long id) {
        FailedEventLog failedEvent = repository.findById(id)
                .orElseThrow(() -> new CustomNotFoundException("실패 이벤트를 찾을 수 없습니다: " + id));
        if (failedEvent.getStatusOrPending() == com.example.ezpay.modules.kafka.entity.FailedEventStatus.RESOLVED) {
            throw new IllegalStateException("이미 재처리가 완료된 이벤트입니다.");
        }

        failedEvent.markRetrying();
        try {
            String originalTopic = originalTopic(failedEvent.getTopic());
            Object payload = deserialize(originalTopic, failedEvent.getPayload());
            kafkaTemplate.send(originalTopic, failedEvent.getKafkaKey(), payload)
                    .get(10, TimeUnit.SECONDS);
            failedEvent.markResolved();
        } catch (Exception e) {
            failedEvent.markRetryFailed(rootMessage(e));
        }
        return FailedEventInfo.from(failedEvent);
    }

    private String originalTopic(String topic) {
        if (topic == null || !topic.endsWith(".DLT")) {
            throw new IllegalArgumentException("DLT 토픽만 재처리할 수 있습니다: " + topic);
        }
        return topic.substring(0, topic.length() - 4);
    }

    private Object deserialize(String topic, String payload) throws Exception {
        return switch (topic) {
            case KafkaConfig.TRANSFER_EVENTS_TOPIC -> objectMapper.readValue(payload, TransferEvent.class);
            case KafkaConfig.RISK_DETECTION_EVENTS_TOPIC -> objectMapper.readValue(payload, RiskDetectionEvent.class);
            case KafkaConfig.SYSTEM_LOG_EVENTS_TOPIC -> objectMapper.readValue(payload, SystemLogEvent.class);
            default -> throw new IllegalArgumentException("지원하지 않는 재처리 토픽입니다: " + topic);
        };
    }

    private String rootMessage(Exception exception) {
        Throwable cause = exception;
        while (cause.getCause() != null) {
            cause = cause.getCause();
        }
        return cause.getMessage() != null ? cause.getMessage() : cause.getClass().getSimpleName();
    }
}
