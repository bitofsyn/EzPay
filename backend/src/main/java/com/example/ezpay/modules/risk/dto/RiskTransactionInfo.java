package com.example.ezpay.modules.risk.dto;

import com.example.ezpay.modules.risk.entity.RiskLevel;
import com.example.ezpay.modules.risk.entity.RiskTransaction;
import com.example.ezpay.modules.risk.entity.RiskTransactionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

// 프론트엔드 RiskTransaction(riskApi.ts) 응답 DTO
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RiskTransactionInfo {
    private String transactionId;
    private RiskLevel level;
    private String sender;
    private String receiver;
    private BigDecimal amount;
    private LocalDateTime datetime;
    private String category;
    private String reason;
    private RiskTransactionStatus status;

    public static RiskTransactionInfo from(RiskTransaction entity) {
        return RiskTransactionInfo.builder()
                .transactionId(entity.getTransactionId())
                .level(entity.getLevel())
                .sender(entity.getSender())
                .receiver(entity.getReceiver())
                .amount(entity.getAmount())
                .datetime(entity.getTransactionDatetime())
                .category(entity.getCategory())
                .reason(entity.getReason())
                .status(entity.getStatus())
                .build();
    }
}
