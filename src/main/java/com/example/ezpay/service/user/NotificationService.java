package com.example.ezpay.service.user;

import com.example.ezpay.request.NotificationRequest;
import com.example.ezpay.response.NotificationResponse;

import java.util.List;

public interface NotificationService {
    List<NotificationResponse> getUserNotifications(Long userId);
    NotificationResponse updateNotification(Long userId, NotificationRequest notificationRequest);
}
