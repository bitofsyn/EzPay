package com.example.ezpay.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class DailyDetail {
    private Long transactionId;
    private String type;
    private String category;
    private Long amount;
    private String memo;
}
