package com.example.ezpay.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AccountOwnerResponse {
    private String accountNumber;
    private String ownerName;
    private Long accountId;
    private String bankName;
}
