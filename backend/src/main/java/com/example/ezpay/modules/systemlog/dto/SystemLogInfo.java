package com.example.ezpay.modules.systemlog.dto;

import com.example.ezpay.modules.systemlog.entity.LogLevel;
import com.example.ezpay.modules.systemlog.entity.SystemLog;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// 프론트엔드 LogEntry(logsApi.ts) 응답 DTO
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemLogInfo {
    private Long id;
    private LocalDateTime time;
    private LogLevel level;
    private String service;
    private String message;

    public static SystemLogInfo from(SystemLog entity) {
        return SystemLogInfo.builder()
                .id(entity.getId())
                .time(entity.getLogTime())
                .level(entity.getLevel())
                .service(entity.getService())
                .message(entity.getMessage())
                .build();
    }
}
