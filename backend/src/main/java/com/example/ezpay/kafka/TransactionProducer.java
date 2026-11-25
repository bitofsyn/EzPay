package com.example.ezpay.kafka;

import com.example.ezpay.model.user.Transaction;
import com.example.ezpay.modules.payment.internal.service.TransferDispatcher;
import com.example.ezpay.shared.messaging.events.TransferEvent;
import com.example.ezpay.shared.messaging.config.KafkaConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

/** Kafka 모드의 송금 디스패처. Kafka 가 꺼져 있으면 SynchronousTransferDispatcher 가 대신 등록된다. */
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "ezpay.kafka.enabled", havingValue = "true", matchIfMissing = true)
public class TransactionProducer implements TransferDispatcher {
    private final KafkaTemplate<String, TransferEvent> kafkaTemplate;

    @Value("${ezpay.kafka.transfer.send-timeout-ms:10000}")
    private long sendTimeoutMs;

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
            kafkaTemplate.send(KafkaConfig.TRANSFER_EVENTS_TOPIC, key, event)
                    .get(sendTimeoutMs, TimeUnit.MILLISECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("송금 이벤트 발행이 중단되었습니다.", e);
        } catch (ExecutionException | TimeoutException e) {
            throw new IllegalStateException("송금 이벤트 발행에 실패했습니다.", e);
        }
    }
}
