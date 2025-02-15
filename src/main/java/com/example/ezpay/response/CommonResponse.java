package com.example.ezpay.response;

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
