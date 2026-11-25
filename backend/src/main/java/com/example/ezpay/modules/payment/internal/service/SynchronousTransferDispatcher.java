package com.example.ezpay.modules.payment.internal.service;

import com.example.ezpay.model.user.Transaction;
import com.example.ezpay.modules.payment.internal.facade.TransferConcurrencyFacade;
import com.example.ezpay.shared.messaging.events.TransferEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Kafka 가 없는 환경(공개 배포 등)에서 송금을 요청 안에서 바로 처리한다.
 * 컨슈머와 같은 {@link TransferConcurrencyFacade} 를 거치므로 계좌 락·사전 FDS·requestId 멱등 처리가 그대로 적용된다.
 * <p>
 * 파사드가 {@link TransactionService} 에 의존하고 서비스가 이 디스패처에 의존하므로, 순환을 피하려고 파사드는 호출 시점에 찾는다.
 */
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "ezpay.kafka.enabled", havingValue = "false")
public class SynchronousTransferDispatcher implements TransferDispatcher {

    private final ObjectProvider<TransferConcurrencyFacade> transferConcurrencyFacade;

    @Override
    public Optional<Transaction> dispatch(TransferEvent event) {
        return Optional.of(transferConcurrencyFacade.getObject().process(event));
    }
}
