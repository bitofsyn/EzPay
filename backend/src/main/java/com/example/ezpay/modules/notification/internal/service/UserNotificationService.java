package com.example.ezpay.modules.notification.internal.service;

import com.example.ezpay.model.user.User;
import com.example.ezpay.modules.notification.api.dto.UserNotificationPage;
import com.example.ezpay.shared.common.enums.UserNotificationCategory;

/**
 * 사용자 알림 피드(이벤트) 서비스.
 * 송금/입금/보안 등 실제 알림 이벤트를 저장·조회·읽음처리하고 실시간(SSE)으로 전달한다.
 */
public interface UserNotificationService {

    // 알림 생성 + 실시간 전송 (송금 처리 등에서 호출)
    void create(User user, UserNotificationCategory category, String title, String message);

    // 사용자 알림 피드 페이지 조회 (최신순)
    UserNotificationPage getFeed(Long userId, int page, int size);

    // 미확인 알림 수
    long getUnreadCount(Long userId);

    // 단건 읽음 처리
    void markRead(Long userId, Long notificationId);

    // 전체 읽음 처리
    void markAllRead(Long userId);
}
