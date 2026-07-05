package com.example.ezpay.shared.common.enums;

public enum TransactionStatus {
    PROCESSING,
    SUCCESS,
    FAILED,
    CANCELLED,
    HELD,      // 위험도 분석 서비스 장애 등으로 송금 일시 보류(재시도/검토 대상)
    BLOCKED,   // 사전 위험도 분석(FDS)에서 사기로 판정되어 차단
}
