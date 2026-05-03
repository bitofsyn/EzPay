package com.example.ezpay.modules.bankconnector.api.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class KftcSelectedAccountRequest {
    private Long userId;
    private String bankCodeStd;
    private String accountNum;
    private String accountSeq;
    private String accountName;
    private String accountLocalCode;
}
