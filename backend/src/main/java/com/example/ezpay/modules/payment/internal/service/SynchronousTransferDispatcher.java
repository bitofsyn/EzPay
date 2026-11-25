package com.example.ezpay.modules.payment.internal.service;

import com.example.ezpay.model.user.Transaction;
import com.example.ezpay.modules.payment.internal.facade.TransferConcurrencyFacade;
import com.example.ezpay.shared.messaging.events.TransferEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Kafka 가 없는 환경(공개 배포 등)에서 송금을 요청 안에서 바로 처리한다.
 * 컨슈머와 같은 {@link TransferConcurrencyFacade} 를 거치므로 계좌 락·사전 FDS·requestId 멱등 처리가 그대로 적용된다.
 * <p>
 * 파사드가 {@link TransactionService} 에 의존하고 서비스가 이 디스패처에 의존하므로, 순환을 피하려고 파사드는 호출 시점에 찾는다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "ezpay.kafka.enabled", havingValue = "false")
public class SynchronousTransferDispatcher implements TransferDispatcher {

    private final ObjectProvider<TransferConcurrencyFacade> transferConcurrencyFacade;

    /** 기동 시 송금이 어느 경로로 처리되는지 남긴다(운영 로그만으로 Kafka 사용 여부를 확인할 수 있도록). */
    @EventListener(ApplicationReadyEvent.class)
    public void logTransferMode() {
        log.info("송금 처리 모드: 동기 처리 (ezpay.kafka.enabled=false, Kafka 미사용 — 송금 요청 안에서 바로 원장에 기록)");
    }

    @Override
    public Optional<Transaction> dispatch(TransferEvent event) {
        return Optional.of(transferConcurrencyFacade.getObject().process(event));
    }
}
