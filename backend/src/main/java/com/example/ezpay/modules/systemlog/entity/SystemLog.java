package com.example.ezpay.modules.systemlog.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(
        name = "system_logs",
        indexes = {
                @Index(name = "idx_system_logs_log_time", columnList = "logTime")
        }
)
public class SystemLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime logTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private LogLevel level;

    @Column(nullable = false)
    private String service;

    @Column(nullable = false, length = 1000)
    private String message;

    @Builder
    public SystemLog(LocalDateTime logTime, LogLevel level, String service, String message) {
        this.logTime = logTime;
        this.level = level;
        this.service = service;
        this.message = message;
    }
}
