package com.example.ezpay.modules.notification.api.facade;

import com.example.ezpay.modules.notification.api.dto.TransferNotificationData;
import com.example.ezpay.shared.common.enums.NotificationType;

/**
 * Notification 모듈의 공개 API Facade
 * 알림 설정 및 전송 관리
 */
public interface NotificationFacade {

    /**
     * 송금 완료 알림 전송
     */
    void sendTransferNotification(Long userId, TransferNotificationData data);

    /**
     * 특정 알림 타입이 활성화되어 있는지 확인
     */
    boolean isNotificationEnabled(Long userId, NotificationType type);

    /**
     * 알림 설정 업데이트
     */
    void updateNotificationSettings(Long userId, NotificationType type, boolean enabled);

    /**
     * 테스트 이메일 발송
     */
    void sendTestEmail(String email);
}
