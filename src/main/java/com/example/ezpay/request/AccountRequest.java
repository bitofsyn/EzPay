package com.example.ezpay.request;

import com.example.ezpay.model.user.Accounts;
import com.example.ezpay.model.user.User;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class AccountRequest {
    private Long userId;
    private String bankName;
    private BigDecimal balance;

    public Accounts toEntity(User user, String accountNumber) {
        return Accounts.builder()
                .user(user)
                .accountNumber(accountNumber)
                .bankName(bankName)
                .balance(balance)
                .build();
    }

}
