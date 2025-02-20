package com.example.ezpay.request;

import com.example.ezpay.model.enums.NotificationType;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class NotificationRequest {
    private NotificationType notificationType;
    private Boolean isEnabled;
}
