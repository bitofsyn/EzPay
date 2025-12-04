package com.example.ezpay.modules.payment.api.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 송금 완료 도메인 이벤트
 * Payment 모듈에서 발행하고, Notification 모듈 등에서 구독
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransferCompletedEvent {
    private Long transactionId;
    private Long fromAccountId;
    private Long toAccountId;
    private BigDecimal amount;
    private Long senderId;
    private Long receiverId;
    private String receiverName;
    private LocalDateTime timestamp;
}
