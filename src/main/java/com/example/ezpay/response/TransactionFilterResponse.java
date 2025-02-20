package com.example.ezpay.response;

import com.example.ezpay.model.user.TransactionFilter;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
public class TransactionFilterResponse {
    private Long filterId;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal minAmount;
    private BigDecimal maxAmount;

    public TransactionFilterResponse(TransactionFilter filter) {
        this.filterId = filter.getFilterId();
        this.startDate = filter.getStartDate();
        this.endDate = filter.getEndDate();
        this.minAmount = filter.getMinAmount();
        this.maxAmount = filter.getMaxAmount();
    }
}
