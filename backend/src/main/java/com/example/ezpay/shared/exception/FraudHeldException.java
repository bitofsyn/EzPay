package com.example.ezpay.shared.exception;

/**
 * 위험도 분석 서비스 장애(서킷 오픈/타임아웃) 등으로 송금을 일시 보류할 때 발생.
 */
public class FraudHeldException extends RuntimeException {
    public FraudHeldException(String message) {
        super(message);
    }
}
