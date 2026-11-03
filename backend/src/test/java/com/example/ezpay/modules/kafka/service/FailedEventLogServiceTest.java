package com.example.ezpay.modules.kafka.service;

import com.example.ezpay.modules.kafka.entity.FailedEventLog;
import com.example.ezpay.modules.kafka.repository.FailedEventLogRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class FailedEventLogServiceTest {

    @Test
    void propagatesRepositoryFailureSoKafkaDoesNotAcknowledgeMessage() {
        FailedEventLogRepository repository = mock(FailedEventLogRepository.class);
        FailedEventLogService service = new FailedEventLogService(repository, new ObjectMapper());
        ConsumerRecord<String, Object> record = new ConsumerRecord<>(
                "transfer-events.DLT", 0, 1L, "request-1", "invalid-payload");
        when(repository.save(any(FailedEventLog.class)))
                .thenThrow(new IllegalStateException("database unavailable"));

        assertThatThrownBy(() -> service.saveFailedEvent(record, "deserialization failed"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("database unavailable");
    }
}
