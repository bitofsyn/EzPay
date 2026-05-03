package com.example.ezpay.modules.bankconnector.api.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class KftcAuthorizationRequest {
    Long userId;
    String clientId;
    String redirectUri;
    String responseType;
    String scope;
    String clientUseCode;
    String state;
    String authType;
}
