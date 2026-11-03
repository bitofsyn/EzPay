package com.example.ezpay.modules.kafka.dto;

import com.example.ezpay.modules.kafka.entity.FailedEventLog;
import com.example.ezpay.modules.kafka.entity.FailedEventStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class FailedEventInfo {
    private Long id;
    private String topic;
    private String kafkaKey;
    private String payload;
    private String errorMessage;
    private FailedEventStatus status;
    private int retryCount;
    private LocalDateTime occurredAt;
    private LocalDateTime lastRetriedAt;
    private LocalDateTime resolvedAt;
    private String lastRetryError;

    public static FailedEventInfo from(FailedEventLog log) {
        return FailedEventInfo.builder()
                .id(log.getId())
                .topic(log.getTopic())
                .kafkaKey(log.getKafkaKey())
                .payload(log.getPayload())
                .errorMessage(log.getErrorMessage())
                .status(log.getStatusOrPending())
                .retryCount(log.getRetryCountOrZero())
                .occurredAt(log.getOccurredAt())
                .lastRetriedAt(log.getLastRetriedAt())
                .resolvedAt(log.getResolvedAt())
                .lastRetryError(log.getLastRetryError())
                .build();
    }
}
