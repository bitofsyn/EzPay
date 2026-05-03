package com.example.ezpay.modules.bankconnector.api.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class KftcAccountInfoRequest {
    Long userId;
    Long connectionId;
    String accessToken;
    String authCode;
    String inquiryBankType;
}
