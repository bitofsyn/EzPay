package com.example.ezpay.shared.common.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class CommonResponse <T> {
    private String status;
    private T data;
    private String message;
}
