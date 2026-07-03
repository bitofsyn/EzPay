package com.example.ezpay.kafka;

import com.example.ezpay.modules.realtime.EventBroadcaster;
import com.example.ezpay.modules.realtime.dto.PipelineStage;
import com.example.ezpay.modules.realtime.dto.PipelineStageStatus;
import com.example.ezpay.modules.realtime.dto.TransactionPipelineEvent;
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
    private static final String SSE_PIPELINE_CHANNEL = "transaction-pipeline";

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
        broadcastPipelineSnapshot(event);
        ack.acknowledge();
    }

    // 실제 Kafka 거래 이벤트를 파이프라인 SSE 채널에도 반영한다.
    // 거래 이벤트는 최종 상태만 담고 있으므로, 성공은 정산 완료, 실패는 이상거래 검증 차단으로 매핑한다.
    private void broadcastPipelineSnapshot(RealtimeTransactionEvent event) {
        boolean failed = "FAILED".equalsIgnoreCase(event.getStatus());
        PipelineStage stage = failed ? PipelineStage.RISK_CHECK : PipelineStage.SETTLEMENT;
        PipelineStageStatus status = failed ? PipelineStageStatus.FAILED : PipelineStageStatus.COMPLETED;
        String message = failed ? "이상거래로 판단되어 거래가 차단되었습니다" : "정산이 완료되어 거래가 종료되었습니다";

        TransactionPipelineEvent pipelineEvent = TransactionPipelineEvent.of(
                event.getId(), stage, status,
                event.getSender(), event.getReceiver(), event.getAmount(),
                event.getResponseMs(), message
        );
        eventBroadcaster.broadcastToSse(SSE_PIPELINE_CHANNEL, pipelineEvent);
    }
}
