package com.example.ezpay.exception;

// 사용자 정의 예외
public class CustomNotFoundException extends RuntimeException{
    public CustomNotFoundException(String message) {
        super(message);
    }
}
