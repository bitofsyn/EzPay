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
        String payloadAsString = getPayloadAsString(record.value());
        FailedEventLog logEntry = FailedEventLog.builder()
                .topic(record.topic())
                .kafkaKey(record.key())
                .payload(payloadAsString)
                .errorMessage(errorMessage)
                .build();
        // 저장 실패를 삼키면 Consumer가 acknowledge하여 복구 불가능한 유실이 발생한다.
        // 예외를 전파해 Kafka 에러 핸들러가 재시도하도록 한다.
        failedEventLogRepository.save(logEntry);
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
