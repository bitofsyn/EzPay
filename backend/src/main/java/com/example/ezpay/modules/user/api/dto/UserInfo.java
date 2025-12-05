package com.example.ezpay.modules.user.api.dto;

import com.example.ezpay.shared.common.enums.Status;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
    사용자 정보 DTO (읽기 전용)
    다른 모듈에 노출되는 사용자 정보
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserInfo {
    private Long userId;
    private String email;
    private String name;
    private String phone;
    private Status status;
    private LocalDateTime createdAt;
}
