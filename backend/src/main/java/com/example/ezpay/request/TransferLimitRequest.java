package com.example.ezpay.request;

import com.example.ezpay.model.user.TransferLimit;
import com.example.ezpay.model.user.User;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class TransferLimitRequest {
    private Long userId;
    private BigDecimal dailyLimit;
    private BigDecimal perTransactionLimit;


    public TransferLimit toEntity(User user) {
        return TransferLimit
                .builder()
                .user(user)
                .dailyLimit(dailyLimit)
                .perTransactionLimit(perTransactionLimit)
                .build();
    }
}
