package com.example.ezpay.modules.notification.internal.service;

import com.example.ezpay.model.user.User;
import com.example.ezpay.model.user.UserNotification;
import com.example.ezpay.modules.notification.api.dto.UserNotificationInfo;
import com.example.ezpay.modules.notification.api.dto.UserNotificationPage;
import com.example.ezpay.modules.realtime.EventBroadcaster;
import com.example.ezpay.repository.user.UserNotificationRepository;
import com.example.ezpay.shared.common.enums.UserNotificationCategory;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserNotificationServiceImpl implements UserNotificationService {

    private final UserNotificationRepository userNotificationRepository;
    private final EventBroadcaster eventBroadcaster;

    // 사용자별 SSE 채널명
    public static String channel(Long userId) {
        return "user-notifications:" + userId;
    }

    @Override
    @Transactional
    public void create(User user, UserNotificationCategory category, String title, String message) {
        UserNotification saved = userNotificationRepository.save(
                UserNotification.builder()
                        .user(user)
                        .category(category)
                        .title(title)
                        .message(message)
                        .isRead(false)
                        .build()
        );

        // 실시간 전송 (구독 중인 클라이언트가 없으면 조용히 무시됨)
        try {
            eventBroadcaster.broadcastToSse(channel(user.getUserId()), UserNotificationInfo.from(saved));
        } catch (Exception e) {
            log.warn("알림 실시간 전송 실패 (userId={}): {}", user.getUserId(), e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public UserNotificationPage getFeed(Long userId, int page, int size) {
        Page<UserNotification> result = userNotificationRepository
                .findByUser_UserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size));

        List<UserNotificationInfo> content = result.getContent().stream()
                .map(UserNotificationInfo::from)
                .toList();

        return new UserNotificationPage(
                content,
                result.getNumber(),
                result.getSize(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.hasNext()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return userNotificationRepository.countByUser_UserIdAndIsReadFalse(userId);
    }

    @Override
    @Transactional
    public void markRead(Long userId, Long notificationId) {
        UserNotification notification = userNotificationRepository
                .findByNotificationIdAndUser_UserId(notificationId, userId)
                .orElseThrow(() -> new EntityNotFoundException("알림을 찾을 수 없습니다."));
        notification.setIsRead(true);
    }

    @Override
    @Transactional
    public void markAllRead(Long userId) {
        userNotificationRepository.markAllReadByUserId(userId);
    }
}
