package com.example.ezpay.shared.messaging.events;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// system-log-events 토픽으로 수신하는 시스템 로그 이벤트
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SystemLogEvent {
    private String level; // INFO, WARN, ERROR, DEBUG
    private String service;
    private String message;
    private LocalDateTime occurredAt;
}
