package com.example.ezpay.modules.account.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 계좌 정보 DTO (읽기 전용)
 * 다른 모듈에 노출되는 계좌 정보
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountInfo {
    private Long accountId;
    private Long userId;
    private String accountNumber;
    private String bankName;
    private BigDecimal balance;
    private Boolean isMainAccount;
    private LocalDateTime createdAt;
}
