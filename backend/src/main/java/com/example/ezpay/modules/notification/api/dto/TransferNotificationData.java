package com.example.ezpay.modules.notification.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 송금 알림 데이터
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransferNotificationData {
    private String email;
    private BigDecimal amount;
    private String receiverName;
    private String transactionId;
}
