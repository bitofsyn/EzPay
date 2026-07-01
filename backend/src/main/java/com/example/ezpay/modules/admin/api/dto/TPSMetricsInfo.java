package com.example.ezpay.modules.admin.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// 프론트엔드 TPSMetrics(metricsApi.ts) 응답 DTO
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TPSMetricsInfo {
    private double currentTPS;
    private double peakTPS;
    private double avgTPS;
    private double successRate;
    private double failureRate;
    private LocalDateTime timestamp;
}
