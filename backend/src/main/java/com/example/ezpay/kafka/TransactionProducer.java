package com.example.ezpay.kafka;

import com.example.ezpay.shared.messaging.events.TransferEvent;
import com.example.ezpay.shared.messaging.config.KafkaConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TransactionProducer {
    private final KafkaTemplate<String, TransferEvent> kafkaTemplate;

    public void sendTransferEvent(TransferEvent event) {
        kafkaTemplate.executeInTransaction(operations -> {
            operations.send(KafkaConfig.TRANSFER_EVENTS_TOPIC, event.getRequestId(), event);
            return null;
        });
    }
}
