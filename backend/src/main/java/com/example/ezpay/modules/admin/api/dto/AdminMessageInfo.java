package com.example.ezpay.modules.admin.api.dto;

import com.example.ezpay.model.admin.AdminMessage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminMessageInfo {
    private Long messageId;
    private String senderName;
    private String senderAvatar;
    private Long senderId;
    private String subject;
    private String content;
    private String category;
    private Boolean isRead;
    private LocalDateTime createdAt;
    private String timeAgo;

    public static AdminMessageInfo from(AdminMessage message) {
        String senderName = message.getSender().getName();
        String avatar = senderName != null && !senderName.isEmpty()
                ? senderName.substring(0, 1).toUpperCase()
                : "U";

        return AdminMessageInfo.builder()
                .messageId(message.getMessageId())
                .senderName(senderName)
                .senderAvatar(avatar)
                .senderId(message.getSender().getUserId())
                .subject(message.getSubject())
                .content(message.getContent())
                .category(message.getCategory().name().toLowerCase())
                .isRead(message.getIsRead())
                .createdAt(message.getCreatedAt())
                .timeAgo(calculateTimeAgo(message.getCreatedAt()))
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
