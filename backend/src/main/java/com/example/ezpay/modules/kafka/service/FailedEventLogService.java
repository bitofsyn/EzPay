package com.example.ezpay.modules.kafka.service;

import com.example.ezpay.modules.kafka.entity.FailedEventLog;
import com.example.ezpay.modules.kafka.repository.FailedEventLogRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class FailedEventLogService {

    private final FailedEventLogRepository failedEventLogRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public void saveFailedEvent(ConsumerRecord<String, Object> record, String errorMessage) {
        try {
            String payloadAsString = getPayloadAsString(record.value());
            FailedEventLog logEntry = FailedEventLog.builder()
                    .topic(record.topic())
                    .kafkaKey(record.key())
                    .payload(payloadAsString)
                    .errorMessage(errorMessage)
                    .build();
            failedEventLogRepository.save(logEntry);
        } catch (Exception e) {
            log.error("Failed to save the failed event log to the database.", e);
        }
    }

    private String getPayloadAsString(Object payload) {
        if (payload == null) {
            return null;
        }
        if (payload instanceof String) {
            return (String) payload;
        }
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            log.error("Could not serialize Kafka message payload to JSON string.", e);
            return "Payload serialization failed: " + payload.toString();
        }
    }
}
