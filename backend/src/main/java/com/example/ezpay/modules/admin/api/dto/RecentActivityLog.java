package com.example.ezpay.modules.admin.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// 최근 활동 로그 DTO
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecentActivityLog {
    private String type;              // 활동 타입 (user, transaction, error, system)
    private String description;       // 활동 설명
    private LocalDateTime timestamp;  // 발생 시간
    private String userName;          // 관련 사용자명 (있는 경우)
    private String status;            // 상태 (success, failed, warning)
}
