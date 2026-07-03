package com.example.ezpay.modules.notification.api.dto;

import com.example.ezpay.model.user.UserNotification;
import com.example.ezpay.shared.common.enums.UserNotificationCategory;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.sql.Timestamp;

/**
 * 사용자 알림 피드 응답 DTO.
 */
@Getter
@AllArgsConstructor
public class UserNotificationInfo {
    private Long notificationId;
    private UserNotificationCategory category;
    private String title;
    private String message;
    private Boolean isRead;
    private Timestamp createdAt;

    public static UserNotificationInfo from(UserNotification n) {
        return new UserNotificationInfo(
                n.getNotificationId(),
                n.getCategory(),
                n.getTitle(),
                n.getMessage(),
                n.getIsRead(),
                n.getCreatedAt()
        );
    }
}
