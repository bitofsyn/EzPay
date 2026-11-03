package com.example.ezpay.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class DailyDetailResponse {
    private Long transactionId; // 거래ID
    private String type; // 거래 타입(DEPOSIT, WITHDRAW)
    private String bankName;
    private Long amount; // 거래 금액
    private String memo; // 메모
}
