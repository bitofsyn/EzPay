package com.example.ezpay.modules.payment.api.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class TransferLimitRequest {
    private Long userId;

    @NotNull(message = "일일 한도를 입력해주세요.")
    @Positive(message = "일일 한도는 0보다 커야 합니다.")
    private BigDecimal dailyLimit;

    @NotNull(message = "1회 한도를 입력해주세요.")
    @Positive(message = "1회 한도는 0보다 커야 합니다.")
    private BigDecimal perTransactionLimit;
}
