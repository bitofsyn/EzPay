package com.example.ezpay.modules.bankconnector.api.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class KftcAccountRegistrationCallbackRequest {
    private Long userId;
    private String code;
    private String state;
    private String fintechUseNum;
    private String bankCodeStd;
    private String accountNum;
    private String accountSeq;
    private String accountName;
    private String accountLocalCode;
}
