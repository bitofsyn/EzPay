package com.example.ezpay.modules.payment.api.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AccountOwnerInfo {
    private String accountNumber;
    private String ownerName;
    private Long accountId;
    private String bankName;
}
