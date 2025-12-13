package com.example.ezpay.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SpendingSummaryDto {
    private String category;
    private BigDecimal totalAmount;
}
