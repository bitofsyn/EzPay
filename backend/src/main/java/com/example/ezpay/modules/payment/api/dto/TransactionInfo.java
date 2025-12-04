package com.example.ezpay.modules.payment.api.dto;

import com.example.ezpay.shared.common.enums.TransactionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 거래 정보 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionInfo {
    private Long transactionId;
    private Long senderAccountId;
    private Long receiverAccountId;
    private BigDecimal amount;
    private String memo;
    private String category;
    private TransactionStatus status;
    private LocalDateTime createdAt;
}
