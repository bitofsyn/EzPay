package com.example.ezpay.modules.bankconnector.api.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class KftcRegisteredAccountRequest {
    Long userId;
    Long connectionId;
}
