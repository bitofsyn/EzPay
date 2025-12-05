package com.example.ezpay.modules.notification.internal.service;

import com.example.ezpay.request.NotificationRequest;
import com.example.ezpay.response.NotificationResponse;
import com.example.ezpay.shared.common.enums.NotificationType;

import java.util.List;

/**
 * Notification 모듈 내부 서비스 - 알림 관리
 */
public interface NotificationService {
    // 사용자 알림 조회
    List<NotificationResponse> getUserNotifications(Long userId);

    // 알림 업데이트
    NotificationResponse updateNotification(Long userId, NotificationRequest notificationRequest);

    // 알림 삭제
    void deleteNotification(Long notificationId);

    // 이메일 발송
    void sendMail(String to, Long amount, String receiverName);

    // 테스트 이메일 발송
    void sendTestEmail(String email);

    // 알림 활성화 여부 확인
    boolean isNotificationEnabled(Long userId, NotificationType type);

    // 신규 사용자 기본 알림 설정 초기화
    void initializeNotificationSettings(Long userId);
}
