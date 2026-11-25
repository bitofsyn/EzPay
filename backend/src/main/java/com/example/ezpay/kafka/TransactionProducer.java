package com.example.ezpay.kafka;

import com.example.ezpay.model.user.Transaction;
import com.example.ezpay.modules.payment.internal.service.TransferDispatcher;
import com.example.ezpay.shared.messaging.events.TransferEvent;
import com.example.ezpay.shared.messaging.config.KafkaConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.NestedExceptionUtils;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

/** Kafka 모드의 송금 디스패처. Kafka 가 꺼져 있으면 SynchronousTransferDispatcher 가 대신 등록된다. */
@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "ezpay.kafka.enabled", havingValue = "true", matchIfMissing = true)
public class TransactionProducer implements TransferDispatcher {
    private final KafkaTemplate<String, TransferEvent> kafkaTemplate;

    @Value("${ezpay.kafka.transfer.send-timeout-ms:10000}")
    private long sendTimeoutMs;

    @Value("${spring.kafka.bootstrap-servers:localhost:9092}")
    private String bootstrapServers;

    @Value("${ezpay.kafka.transfer.partitions:6}")
    private int partitions;

    @Value("${ezpay.kafka.transfer.concurrency:6}")
    private int concurrency;

    /** 기동 시 송금이 어느 경로로 처리되는지 남긴다(운영 로그만으로 Kafka 사용 여부를 확인할 수 있도록). */
    @EventListener(ApplicationReadyEvent.class)
    public void logTransferMode() {
        log.info("송금 처리 모드: Kafka 비동기 (bootstrap={}, topic={}, partitions={}, consumers={})",
                bootstrapServers, KafkaConfig.TRANSFER_EVENTS_TOPIC, partitions, concurrency);
    }

    @Override
    public Optional<Transaction> dispatch(TransferEvent event) {
        sendTransferEvent(event);
        return Optional.empty(); // 처리는 컨슈머가 비동기로 수행한다
    }

    /**
     * 송금 이벤트를 발행하고 브로커 확인(acks=all)까지 기다린다. 202 응답은 이벤트가 저장된 뒤에만 나간다.
     * 메시지 키는 출금 계좌 ID 라서 같은 계좌의 송금은 같은 파티션에서 요청 순서대로 처리된다.
     */
    public void sendTransferEvent(TransferEvent event) {
        String key = String.valueOf(event.getFromAccountId());
        try {
            SendResult<String, TransferEvent> result = kafkaTemplate.send(KafkaConfig.TRANSFER_EVENTS_TOPIC, key, event)
                    .get(sendTimeoutMs, TimeUnit.MILLISECONDS);
            log.debug("송금 이벤트 발행: requestId={}, partition={}, offset={}", event.getRequestId(),
                    result.getRecordMetadata().partition(), result.getRecordMetadata().offset());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("송금 이벤트 발행 중단: requestId={}", event.getRequestId(), e);
            throw new IllegalStateException("송금 이벤트 발행이 중단되었습니다.", e);
        } catch (ExecutionException | TimeoutException | RuntimeException e) {
            // 브로커 미연결(메타데이터 대기 초과)·확인 시간 초과 등. 컨트롤러는 500 만 응답하므로 원인은 여기서 남긴다.
            Throwable cause = NestedExceptionUtils.getMostSpecificCause(e); // 예: Topic ... not present in metadata after 5000 ms
            log.error("송금 이벤트 발행 실패: requestId={}, key={}, bootstrap={}, 원인={}",
                    event.getRequestId(), key, bootstrapServers, cause.toString());
            throw new IllegalStateException("송금 이벤트 발행에 실패했습니다.", e);
        }
    }
}
