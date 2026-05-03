package com.example.ezpay.modules.bankconnector.api.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class KftcTokenExchangeRequest {
    Long userId;
    String authorizationCode;
    String redirectUri;
    String clientId;
    String clientSecret;
    String grantType;
}
