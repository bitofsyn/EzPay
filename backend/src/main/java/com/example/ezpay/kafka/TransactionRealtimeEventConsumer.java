package com.example.ezpay.kafka;

import com.example.ezpay.modules.realtime.EventBroadcaster;
import com.example.ezpay.shared.messaging.config.KafkaConfig;
import com.example.ezpay.shared.messaging.events.RealtimeTransactionEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Service;

// 관리자 대시보드 실시간 거래 스트림(realtimeApi.ts) 브로드캐스트용 컨슈머
@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "ezpay.kafka.enabled", havingValue = "true", matchIfMissing = true)
public class TransactionRealtimeEventConsumer {

    private static final String TOPIC_TRANSACTIONS = "admin:dashboard:transactions";

    private final EventBroadcaster eventBroadcaster;

    @KafkaListener(
            topics = KafkaConfig.TRANSACTION_EVENTS_TOPIC,
            groupId = "admin-dashboard-consumer",
            containerFactory = "kafkaListenerContainerFactory",
            autoStartup = "${spring.kafka.listener.auto-startup:false}"
    )
    public void consumeTransactionEvent(RealtimeTransactionEvent event, Acknowledgment ack) {
        log.info("실시간 거래 이벤트 수신: {}", event);
        eventBroadcaster.broadcastToTopic(TOPIC_TRANSACTIONS, event);
        ack.acknowledge();
    }
}
