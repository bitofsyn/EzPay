package com.example.ezpay.modules.notification.internal.service;

import com.example.ezpay.modules.notification.api.dto.NotificationInfo;
import com.example.ezpay.modules.notification.api.dto.NotificationSettingRequest;

import java.util.List;

/**
 * Notification 모듈 내부 서비스 - 알림 관리
 */
public interface NotificationService {
    // 사용자 알림 조회
    List<NotificationInfo> getUserNotifications(Long userId);

    // 알림 업데이트
    NotificationInfo updateNotification(Long userId, NotificationSettingRequest notificationRequest);

    // 알림 삭제
    void deleteNotification(Long notificationId);

    // 이메일 발송
    void sendMail(String to, Long amount, String receiverName);
}
