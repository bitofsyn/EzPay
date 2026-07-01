package com.example.ezpay.modules.account.api.dto;

import com.example.ezpay.model.user.Accounts;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

import java.math.BigDecimal;
import java.sql.Timestamp;

/**
 * AccountController가 프론트엔드로 반환하는 계좌 응답 DTO.
 * JPA 엔티티(Accounts)를 직접 반환하지 않고, 프론트엔드 Account 타입(accountName, isMain, userId)에 맞춰 변환한다.
 */
@Getter
public class AccountResponse {
    private final Long accountId;
    private final String accountNumber;
    private final String accountName;
    private final BigDecimal balance;

    @JsonProperty("isMain")
    private final boolean isMain;

    private final Timestamp createdAt;

    public AccountResponse(Accounts account) {
        this.accountId = account.getAccountId();
        this.accountNumber = account.getAccountNumber();
        this.accountName = account.getBankName();
        this.balance = account.getBalance();
        this.isMain = account.isMain();
        this.createdAt = account.getCreatedAt();
    }
}
