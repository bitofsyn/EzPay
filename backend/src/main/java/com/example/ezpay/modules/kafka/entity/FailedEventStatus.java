package com.example.ezpay.modules.kafka.entity;

public enum FailedEventStatus {
    PENDING,
    RETRYING,
    RESOLVED,
    RETRY_FAILED
}
