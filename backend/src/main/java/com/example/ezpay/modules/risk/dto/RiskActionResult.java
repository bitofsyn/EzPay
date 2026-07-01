package com.example.ezpay.modules.risk.dto;

import com.example.ezpay.modules.risk.entity.RiskTransaction;
import com.example.ezpay.modules.risk.entity.RiskTransactionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// 프론트엔드 RiskActionResponse(riskApi.ts) 응답 DTO
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RiskActionResult {
    private String transactionId;
    private RiskTransactionStatus status;
    private LocalDateTime approvedAt;

    public static RiskActionResult from(RiskTransaction entity) {
        return RiskActionResult.builder()
                .transactionId(entity.getTransactionId())
                .status(entity.getStatus())
                .approvedAt(entity.getApprovedAt())
                .build();
    }
}
