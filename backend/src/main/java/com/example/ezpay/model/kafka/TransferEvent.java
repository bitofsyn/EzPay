package com.example.ezpay.model.kafka;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransferEvent {
    private Long fromAccountId;
    private Long toAccountId;
    private BigDecimal amount;
    private String memo;
    private String category;
}
