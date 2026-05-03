package com.example.ezpay.modules.bankconnector.api.dto;

import com.example.ezpay.shared.common.enums.FinancialDataProvider;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LinkTokenRequest {
    private Long userId;
    private FinancialDataProvider provider;
}
