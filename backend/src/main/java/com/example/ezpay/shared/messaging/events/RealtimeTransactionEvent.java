package com.example.ezpay.shared.messaging.events;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

// transaction-events 토픽으로 수신하는 관리자 대시보드용 실시간 거래 이벤트
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RealtimeTransactionEvent {
    private String uid;
    private LocalDateTime time;
    private String id;
    private String sender;
    private String receiver;
    private BigDecimal amount;
    private String status; // SUCCESS, PENDING, FAILED
    private long responseMs;
}
