package com.example.ezpay.kafka;

import com.example.ezpay.modules.kafka.service.FailedEventLogService;
import com.example.ezpay.modules.payment.internal.service.TransactionService;
import com.example.ezpay.shared.messaging.config.KafkaConfig;
import com.example.ezpay.shared.messaging.events.TransferEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class TransactionConsumer {

    private final TransactionService transactionService;
    private final FailedEventLogService failedEventLogService;

    @KafkaListener(
            topics = KafkaConfig.TRANSFER_EVENTS_TOPIC,
            groupId = "ezpay-group",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void consumerTransferEvent(TransferEvent event, Acknowledgment ack) {
        log.info("이벤트 수신: {}", event);
        // DefaultErrorHandler가 예외를 처리하므로, 서비스 레이어의 예외가 그대로 전파되도록 함
        transactionService.processTransfer(event);
        ack.acknowledge();
    }

    @KafkaListener(
            topics = KafkaConfig.TRANSFER_EVENTS_DLT,
            groupId = "ezpay-dlt-group"
    )
    public void dltListener(ConsumerRecord<String, Object> record,
                            Acknowledgment ack,
                            @Header(KafkaHeaders.DLT_EXCEPTION_MESSAGE) String errorMessage) {
        log.error("DLT 수신: 메시지 처리 최종 실패. key={}, value={}, offset={}", record.key(), record.value(), record.offset());

        // 실패한 이벤트를 DB에 저장
        failedEventLogService.saveFailedEvent(record, errorMessage);

        ack.acknowledge(); // DLT 메시지는 소비 후 커밋
    }
}
