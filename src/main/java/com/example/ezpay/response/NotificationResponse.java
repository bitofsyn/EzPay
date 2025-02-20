package com.example.ezpay.response;

import com.example.ezpay.model.enums.NotificationType;
import com.example.ezpay.model.user.Notification;
import lombok.Getter;

import java.sql.Timestamp;

@Getter
public class NotificationResponse {
    private Long notificationId;
    private NotificationType notificationType;
    private Boolean isEnabled;
    private Timestamp createdAt;


    public NotificationResponse(Notification notification) {
        this.notificationId = notification.getNotificationId();
        this.notificationType = notification.getNotificationType();
        this.isEnabled = notification.getIsEnabled();
        this.createdAt = notification.getCreatedAt();
    }
}
