package com.example.ezpay.response;

import com.example.ezpay.model.enums.NotificationType;
import com.example.ezpay.model.user.Notification;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.sql.Timestamp;

@Getter
@AllArgsConstructor
public class NotificationResponse {
    private Long notificationId;
    private NotificationType notificationType;
    private Boolean isEnabled;
    private Timestamp createdAt;
}

