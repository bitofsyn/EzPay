package com.example.ezpay.modules.bankconnector.api.dto;

import com.example.ezpay.shared.common.enums.FinancialDataProvider;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class TransactionSyncRequest {
    FinancialDataProvider provider;
    Long userId;
    String connectionReference;
    String accessToken;
    String cursor;
}
