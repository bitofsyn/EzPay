package com.example.ezpay.modules.payment.api.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class TransferRequest {
    @NotNull(message = "출금 계좌를 선택해주세요.")
    private Long fromAccountId;

    @NotNull(message = "입금 계좌를 선택해주세요.")
    private Long toAccountId;

    @NotNull(message = "송금 금액을 입력해주세요.")
    @DecimalMin(value = "0.01", message = "송금 금액은 0보다 커야 합니다.")
    private BigDecimal amount;

    private String memo;
    private String category;
    private boolean isCategoryManuallyEdited;
}
