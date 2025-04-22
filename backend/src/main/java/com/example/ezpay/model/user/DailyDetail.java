package com.example.ezpay.model.user;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class DailyDetail {
    private Long transactionId;
    private String type;
    private String category;
    private Long amount;
    private String memo;
}
