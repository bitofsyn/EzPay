package com.example.ezpay.service.user.impl;

import com.example.ezpay.model.user.Notification;
import com.example.ezpay.model.user.User;
import com.example.ezpay.repository.user.NotificationRepository;
import com.example.ezpay.repository.user.UserRepository;
import com.example.ezpay.request.NotificationRequest;
import com.example.ezpay.response.NotificationResponse;
import com.example.ezpay.service.user.NotificationService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final ModelMapper modelMapper;

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getUserNotifications(Long userId) {
        List<Notification> notifications = notificationRepository.findByUserId(userId);

        return notifications.stream()
                .map(n -> new NotificationResponse(n.getNotificationId(), n.getNotificationType(), n.getIsEnabled(), n.getCreatedAt()))
                .collect(Collectors.toList());
    }


    @Override
    @Transactional
    public NotificationResponse updateNotification(Long userId, NotificationRequest notificationRequest) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));

        Notification notification = notificationRepository
                .findByUserAndNotificationType(user, notificationRequest.getNotificationType())
                .orElseThrow(() -> new EntityNotFoundException("해당 알림 설정을 찾을 수 없습니다."));

        notification.setIsEnabled(notificationRequest.getIsEnabled());
        notificationRepository.save(notification);

        return new NotificationResponse(notification.getNotificationId(), notification.getNotificationType(), notification.getIsEnabled(), notification.getCreatedAt());
    }

    @Override
    @Transactional
    public void deleteNotification(Long notificationId) {
        if (!notificationRepository.existsById(notificationId)) {
            throw new EntityNotFoundException("알림을 찾을 수 없습니다.");
        }
        notificationRepository.deleteById(notificationId);
    }
}
