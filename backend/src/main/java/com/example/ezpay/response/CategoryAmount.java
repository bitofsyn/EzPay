package com.example.ezpay.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CategoryAmount {
    private String category;
    private Long amount;
}
