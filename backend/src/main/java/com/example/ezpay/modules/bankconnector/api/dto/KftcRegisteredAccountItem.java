package com.example.ezpay.modules.bankconnector.api.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class KftcRegisteredAccountItem {
    String fintechUseNum;
    String accountAlias;
    String bankCodeStd;
    String bankName;
    String accountNumMasked;
    String accountHolderName;
    String accountType;
    String inquiryAgreeYn;
    String transferAgreeYn;
}
