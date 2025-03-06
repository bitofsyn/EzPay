package com.example.ezpay.request;

import com.example.ezpay.model.user.TransactionFilter;
import com.example.ezpay.model.user.User;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class TransactionFilterRequest {
    private Long userId;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal minAmount;
    private BigDecimal maxAmount;

    public TransactionFilter toEntity(User user) {
        return TransactionFilter
                .builder()
                .user(user)
                .startDate(startDate)
                .endDate(endDate)
                .minAmount(minAmount)
                .maxAmount(maxAmount)
                .build();
    }
}
