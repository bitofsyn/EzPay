package com.example.ezpay.modules.admin.api.dto;

import com.example.ezpay.shared.common.enums.ErrorLogStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// 에러 로그 정보 DTO
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErrorLogInfo {
    private Long logId;
    private String serviceName;
    private String errorMessage;
    private LocalDateTime occurredAt;
    private ErrorLogStatus status;
}
