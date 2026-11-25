package com.example.ezpay.modules.payment.internal.service;

import com.example.ezpay.model.user.Transaction;
import com.example.ezpay.shared.messaging.events.TransferEvent;

import java.util.Optional;

/**
 * 접수된 송금 이벤트를 실제 처리 경로로 넘긴다.
 * <ul>
 *     <li>Kafka 사용 시({@code ezpay.kafka.enabled=true}): 이벤트를 발행만 하고 컨슈머가 비동기로 처리한다 → 빈 결과</li>
 *     <li>Kafka 미사용 시: 요청 스레드에서 바로 처리한다 → 처리 결과(최종 상태가 기록된 거래)</li>
 * </ul>
 */
public interface TransferDispatcher {

    Optional<Transaction> dispatch(TransferEvent event);
}
