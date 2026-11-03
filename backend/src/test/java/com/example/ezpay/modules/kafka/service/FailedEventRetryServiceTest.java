package com.example.ezpay.modules.kafka.service;

import com.example.ezpay.modules.kafka.dto.FailedEventInfo;
import com.example.ezpay.modules.kafka.entity.FailedEventLog;
import com.example.ezpay.modules.kafka.entity.FailedEventStatus;
import com.example.ezpay.modules.kafka.repository.FailedEventLogRepository;
import com.example.ezpay.shared.messaging.events.TransferEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.kafka.core.KafkaTemplate;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class FailedEventRetryServiceTest {

    @Test
    void republishesDeserializedEventToOriginalTopicAndMarksResolved() throws Exception {
        FailedEventLogRepository repository = mock(FailedEventLogRepository.class);
        @SuppressWarnings("unchecked")
        KafkaTemplate<String, Object> kafkaTemplate = mock(KafkaTemplate.class);
        ObjectMapper objectMapper = new ObjectMapper();
        TransferEvent event = new TransferEvent(
                "request-1", 1L, 2L, new BigDecimal("1000"), "memo", "식비", false);
        FailedEventLog failedEvent = FailedEventLog.builder()
                .topic("transfer-events.DLT")
                .kafkaKey("request-1")
                .payload(objectMapper.writeValueAsString(event))
                .errorMessage("temporary failure")
                .build();
        when(repository.findById(1L)).thenReturn(Optional.of(failedEvent));
        when(kafkaTemplate.send(eq("transfer-events"), eq("request-1"), any(TransferEvent.class)))
                .thenReturn(CompletableFuture.completedFuture(null));
        FailedEventRetryService service = new FailedEventRetryService(repository, objectMapper, kafkaTemplate);

        FailedEventInfo result = service.retry(1L);

        assertThat(result.getStatus()).isEqualTo(FailedEventStatus.RESOLVED);
        assertThat(result.getRetryCount()).isEqualTo(1);
        assertThat(result.getResolvedAt()).isNotNull();
        verify(kafkaTemplate).send(eq("transfer-events"), eq("request-1"), any(TransferEvent.class));
    }

    @Test
    void recordsRetryFailureWhenPayloadCannotBeRestored() {
        FailedEventLogRepository repository = mock(FailedEventLogRepository.class);
        @SuppressWarnings("unchecked")
        KafkaTemplate<String, Object> kafkaTemplate = mock(KafkaTemplate.class);
        FailedEventLog failedEvent = FailedEventLog.builder()
                .topic("transfer-events.DLT")
                .payload("not-json")
                .errorMessage("deserialization failure")
                .build();
        when(repository.findById(2L)).thenReturn(Optional.of(failedEvent));
        FailedEventRetryService service = new FailedEventRetryService(
                repository, new ObjectMapper(), kafkaTemplate);

        FailedEventInfo result = service.retry(2L);

        assertThat(result.getStatus()).isEqualTo(FailedEventStatus.RETRY_FAILED);
        assertThat(result.getRetryCount()).isEqualTo(1);
        assertThat(result.getLastRetryError()).isNotBlank();
    }
}
