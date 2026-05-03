package com.example.ezpay.modules.bankconnector.api.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class KftcTokenExchangeCallbackRequest {
    private Long userId;
    private String authorizationCode;
    private String authorizationState;
    private String accessToken;
    private String refreshToken;
    private String userSeqNo;
    private String scope;
    private Long expiresIn;
    private String tokenType;
}
