package com.example.ezpay.modules.risk.fds.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

/**
 * FDS 룰 평가에 필요한 송금 컨텍스트(불변).
 * 계좌 락을 잡은 트랜잭션 안에서 조립되어 각 {@code FraudRule}에 전달된다.
 */
@Getter
@Builder
public class FraudCheckContext {
    private final String requestId;
    private final Long fromAccountId;
    private final Long toAccountId;
    private final String fromAccountNumber;
    private final String toAccountNumber;
    private final String senderName;
    private final String receiverName;
    private final BigDecimal amount;
    private final String category;
}
