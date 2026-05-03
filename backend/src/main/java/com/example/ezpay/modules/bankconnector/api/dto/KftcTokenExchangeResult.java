package com.example.ezpay.modules.bankconnector.api.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class KftcTokenExchangeResult {
    String accessToken;
    String refreshToken;
    String userSeqNo;
    String scope;
    Long expiresIn;
    String tokenType;
}
