package com.example.ezpay.modules.notification.internal.facade;

import com.example.ezpay.modules.notification.api.dto.TransferNotificationData;
import com.example.ezpay.modules.notification.api.facade.NotificationFacade;
import com.example.ezpay.modules.notification.internal.service.NotificationService;
import com.example.ezpay.shared.common.enums.NotificationType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * NotificationFacade 구현체
 * 다른 모듈에서 Notification 기능을 사용할 때 이 Facade를 통해 접근
 */
@Component
@RequiredArgsConstructor
public class NotificationFacadeImpl implements NotificationFacade {

    private final NotificationService notificationService;

    @Override
    public void sendTransferNotification(Long userId, TransferNotificationData data) {
        // 알림이 활성화되어 있는지 확인
        if (isNotificationEnabled(userId, NotificationType.EMAIL)) {
            notificationService.sendMail(
                    data.getEmail(),
                    data.getAmount().longValue(),
                    data.getReceiverName()
            );
        }
    }

    @Override
    public boolean isNotificationEnabled(Long userId, NotificationType type) {
        return notificationService.isNotificationEnabled(userId, type);
    }

    @Override
    public void updateNotificationSettings(Long userId, NotificationType type, boolean enabled) {
        // NotificationRequest를 사용하는 기존 메서드를 활용
        // 또는 새로운 메서드 추가 필요
        // 일단 간단히 구현
        com.example.ezpay.request.NotificationRequest request =
                new com.example.ezpay.request.NotificationRequest();
        request.setNotificationType(type);
        request.setIsEnabled(enabled);
        notificationService.updateNotification(userId, request);
    }

    @Override
    public void sendTestEmail(String email) {
        notificationService.sendTestEmail(email);
    }

    @Override
    public void initializeNotificationSettings(Long userId) {
        notificationService.initializeNotificationSettings(userId);
    }
}
