package com.example.ezpay.shared.exception;

/**
 * 사전 위험도 분석(FDS)에서 사기로 판정되어 송금이 차단될 때 발생.
 */
public class FraudBlockedException extends RuntimeException {
    public FraudBlockedException(String message) {
        super(message);
    }
}
