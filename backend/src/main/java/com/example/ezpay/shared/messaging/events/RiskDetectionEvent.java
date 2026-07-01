package com.example.ezpay.shared.messaging.events;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

// risk-detection-events 토픽으로 수신하는 위험거래 감지 이벤트
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RiskDetectionEvent {
    private String transactionId;
    private String riskLevel; // DANGER, CAUTION, SAFE
    private String sender;
    private String receiver;
    private BigDecimal amount;
    private String category;
    private String reason;
    private LocalDateTime detectedAt;
}
