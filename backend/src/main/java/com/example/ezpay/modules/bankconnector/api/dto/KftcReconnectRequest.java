package com.example.ezpay.modules.bankconnector.api.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class KftcReconnectRequest {
    private Long userId;
    private Long connectionId;
}
