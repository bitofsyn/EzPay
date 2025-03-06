package com.example.ezpay.exception;

public class DuplicateAccountNumberException extends RuntimeException{
    public DuplicateAccountNumberException(String message) {
        super(message);
    }
}
