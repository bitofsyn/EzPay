package com.example.ezpay.modules.user.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 로그인 이력 정보 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginHistoryInfo {
    private Long historyId;
    private Long userId;
    private String ipAddress;
    private String deviceInfo;
    private LocalDateTime loginTime;
}
