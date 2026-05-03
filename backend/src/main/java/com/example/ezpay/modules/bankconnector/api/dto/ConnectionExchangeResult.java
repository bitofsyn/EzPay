package com.example.ezpay.modules.bankconnector.api.dto;

import com.example.ezpay.shared.common.enums.FinancialDataProvider;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ConnectionExchangeResult {
    FinancialDataProvider provider;
    String connectionReference;
    String providerAccountReference;
    String accessToken;
}
