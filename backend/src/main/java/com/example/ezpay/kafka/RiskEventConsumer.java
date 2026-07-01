package com.example.ezpay.kafka;

import com.example.ezpay.modules.risk.entity.RiskLevel;
import com.example.ezpay.modules.risk.entity.RiskTransaction;
import com.example.ezpay.modules.risk.entity.RiskTransactionStatus;
import com.example.ezpay.modules.risk.service.RiskTransactionService;
import com.example.ezpay.shared.messaging.config.KafkaConfig;
import com.example.ezpay.shared.messaging.events.RiskDetectionEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "ezpay.kafka.enabled", havingValue = "true", matchIfMissing = true)
public class RiskEventConsumer {

    private final RiskTransactionService riskTransactionService;

    @KafkaListener(
            topics = KafkaConfig.RISK_DETECTION_EVENTS_TOPIC,
            groupId = "admin-dashboard-consumer",
            containerFactory = "kafkaListenerContainerFactory",
            autoStartup = "${spring.kafka.listener.auto-startup:false}"
    )
    public void consumeRiskEvent(RiskDetectionEvent event, Acknowledgment ack) {
        log.info("위험거래 이벤트 수신: {}", event);

        RiskTransaction riskTransaction = RiskTransaction.builder()
                .transactionId(event.getTransactionId())
                .level(RiskLevel.valueOf(event.getRiskLevel()))
                .sender(event.getSender())
                .receiver(event.getReceiver())
                .amount(event.getAmount())
                .transactionDatetime(event.getDetectedAt() != null ? event.getDetectedAt() : LocalDateTime.now())
                .category(event.getCategory())
                .reason(event.getReason())
                .status(RiskTransactionStatus.PENDING_REVIEW)
                .build();

        riskTransactionService.save(riskTransaction);
        ack.acknowledge();
    }
}
