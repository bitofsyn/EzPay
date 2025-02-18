package com.example.ezpay.kafka;

import com.example.ezpay.model.kafka.TransferEvent;
import com.example.ezpay.service.user.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Service;
import org.springframework.kafka.annotation.KafkaListener;

@Service
@RequiredArgsConstructor
public class TransactionConsumer {

    private final TransactionService transactionService;

    @KafkaListener(
            topics = "transfer-events",
            groupId = "ezpay-group"
//            containerFactory = "kafkaListenerContainerFactory"
    )
    public void consumerTransferEvent(TransferEvent event, Acknowledgment ack) {
        try {
            // 이벤트 수신 후 송금 처리
            transactionService.processTransfer(event);
            ack.acknowledge();
        } catch (Exception e) {
            System.err.println("Kafka 처리 실패: " + e.getMessage());

            // TODO: 실패한 이벤트를 별도 로그테이블에 저장하거나, 재처리 로직 추가
        }
    }

}
