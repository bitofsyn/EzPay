package com.example.ezpay.modules.payment.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 송금 요청 커맨드
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransferCommand {
    private Long fromAccountId;
    private Long toAccountId;
    private BigDecimal amount;
    private String memo;
    private String category;
}
