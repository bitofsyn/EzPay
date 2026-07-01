package com.example.ezpay.modules.notification.api.dto;

import com.example.ezpay.shared.common.enums.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.sql.Timestamp;

@Getter
@AllArgsConstructor
public class NotificationInfo {
    private Long notificationId;
    private NotificationType notificationType;
    private Boolean isEnabled;
    private Timestamp createdAt;
}
