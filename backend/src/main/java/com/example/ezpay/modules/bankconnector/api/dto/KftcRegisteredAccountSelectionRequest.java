package com.example.ezpay.modules.bankconnector.api.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class KftcRegisteredAccountSelectionRequest {
    Long userId;
    String fintechUseNum;
    String bankCodeStd;
    String accountNumMasked;
    String accountAlias;
    String accountHolderName;
}
