package com.example.ezpay.kafka;

import com.example.ezpay.shared.messaging.events.TransferEvent;
import com.example.ezpay.shared.messaging.config.KafkaConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

@Service
@RequiredArgsConstructor
public class TransactionProducer {
    private final KafkaTemplate<String, TransferEvent> kafkaTemplate;

    @Value("${ezpay.kafka.transfer.send-timeout-ms:10000}")
    private long sendTimeoutMs;

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
