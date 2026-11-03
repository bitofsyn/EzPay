package com.example.ezpay.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CategoryAmountResponse {
    private String category; // 카테고리 이름
    private Long amount; // 해당 카테고리별 총합 금액
}
