package com.example.ezpay.modules.bankconnector.api.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class KftcReconnectResult {
    Long userId;
    Long connectionId;
    String status;
    String message;
    Integer deletedTransactionCount;
}
