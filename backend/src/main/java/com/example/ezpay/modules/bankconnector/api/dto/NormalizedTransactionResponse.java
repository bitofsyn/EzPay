package com.example.ezpay.modules.bankconnector.api.dto;

import com.example.ezpay.shared.common.enums.FinancialDataProvider;
import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Value
@Builder
public class NormalizedTransactionResponse {
    Long normalizedTransactionId;
    Long connectionId;
    FinancialDataProvider provider;
    String providerTransactionId;
    String providerAccountId;
    OffsetDateTime postedAt;
    OffsetDateTime authorizedAt;
    BigDecimal amount;
    String currencyCode;
    String direction;
    String merchantName;
    String description;
    String primaryCategory;
    String detailedCategory;
    boolean pending;
}
