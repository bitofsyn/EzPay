package com.example.ezpay.shared.exception;

public class DuplicateAccountNumberException extends RuntimeException{
    public DuplicateAccountNumberException(String message) {
        super(message);
    }
}
