package com.example.ezpay.modules.admin.api.dto;

import com.example.ezpay.model.admin.AdminAlert;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminAlertInfo {
    private Long alertId;
    private String alertType;
    private String title;
    private String message;
    private Boolean isRead;
    private LocalDateTime createdAt;
    private String timeAgo;

    public static AdminAlertInfo from(AdminAlert alert) {
        return AdminAlertInfo.builder()
                .alertId(alert.getAlertId())
                .alertType(alert.getAlertType().name().toLowerCase())
                .title(alert.getTitle())
                .message(alert.getMessage())
                .isRead(alert.getIsRead())
                .createdAt(alert.getCreatedAt())
                .timeAgo(calculateTimeAgo(alert.getCreatedAt()))
                .build();
    }

    private static String calculateTimeAgo(LocalDateTime createdAt) {
        if (createdAt == null) return "";

        LocalDateTime now = LocalDateTime.now();
        long minutes = java.time.Duration.between(createdAt, now).toMinutes();

        if (minutes < 1) return "방금 전";
        if (minutes < 60) return minutes + "분 전";

        long hours = minutes / 60;
        if (hours < 24) return hours + "시간 전";

        long days = hours / 24;
        if (days < 7) return days + "일 전";

        return createdAt.toLocalDate().toString();
    }
}
