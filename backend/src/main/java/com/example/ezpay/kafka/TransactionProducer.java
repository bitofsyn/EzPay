package com.example.ezpay.kafka;

import com.example.ezpay.model.kafka.TransferEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TransactionProducer {
    private final KafkaTemplate<String, TransferEvent> kafkaTemplate;
    private static final String TOPIC = "transfer-events";

    public void sendTransferEvent(TransferEvent event) {
        kafkaTemplate.executeInTransaction(operations -> {
            operations.send(TOPIC, event);
            return null;
        });
    }
}
