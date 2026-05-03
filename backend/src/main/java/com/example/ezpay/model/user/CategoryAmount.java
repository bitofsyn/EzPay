package com.example.ezpay.model.user;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CategoryAmount {
    private String category;
    private Long amount;
}
