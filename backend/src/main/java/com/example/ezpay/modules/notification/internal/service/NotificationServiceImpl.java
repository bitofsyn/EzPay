package com.example.ezpay.modules.notification.internal.service;

import com.example.ezpay.shared.common.enums.NotificationType;
import com.example.ezpay.model.user.Notification;
import com.example.ezpay.model.user.User;
import com.example.ezpay.modules.notification.api.dto.NotificationInfo;
import com.example.ezpay.modules.notification.api.dto.NotificationSettingRequest;
import com.example.ezpay.repository.user.NotificationRepository;
import com.example.ezpay.repository.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final JavaMailSender mailSender;

    @Override
    @Transactional(readOnly = true)
    public List<NotificationInfo> getUserNotifications(Long userId) {
        List<Notification> notifications = notificationRepository.findByUserId(userId);

        return notifications.stream()
                .map(n -> new NotificationInfo(n.getNotificationId(), n.getNotificationType(), n.getIsEnabled(), n.getCreatedAt()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public NotificationInfo updateNotification(Long userId, NotificationSettingRequest notificationRequest) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));

        Notification notification = notificationRepository
                .findByUserAndNotificationType(user, notificationRequest.getNotificationType())
                .orElseThrow(() -> new EntityNotFoundException("해당 알림 설정을 찾을 수 없습니다."));

        notification.setIsEnabled(notificationRequest.getIsEnabled());
        notificationRepository.save(notification);

        if(notification.getNotificationType() == NotificationType.EMAIL
                && Boolean.TRUE.equals(notificationRequest.getIsEnabled())) {
            initEmail(user.getEmail());
        }

        return new NotificationInfo(notification.getNotificationId(), notification.getNotificationType(), notification.getIsEnabled(), notification.getCreatedAt());
    }

    @Override
    @Transactional
    public void deleteNotification(Long userId, Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new EntityNotFoundException("알림을 찾을 수 없습니다."));
        if (!notification.getUser().getUserId().equals(userId)) {
            throw new AccessDeniedException("다른 사용자의 알림을 삭제할 수 없습니다.");
        }
        notificationRepository.delete(notification);
    }

    private void initEmail(String to) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("EzPay 이메일 알림 설정 완료");
        message.setText("이메일 알림 수신이 성공적으로 설정되었습니다");
        mailSender.send(message);
    }

    @Override
    public void sendMail(String to, Long amount, String receiverName) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("EzPay 송금 완료 알림");
        message.setText(String.format("%s님에게 %s원이 성공적으로 송금되었습니다.", receiverName, amount));
        mailSender.send(message);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isNotificationEnabled(Long userId, NotificationType type) {
        User user = userRepository.findById(userId).orElse(null);
        return user != null && notificationRepository.findByUserAndNotificationType(user, type)
                .map(Notification::getIsEnabled)
                .orElse(false);
    }

    @Override
    public void sendTestEmail(String email) {
        initEmail(email);
    }

    @Override
    @Transactional
    public void initializeNotificationSettings(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));

        for (NotificationType type : NotificationType.values()) {
            notificationRepository.findByUserAndNotificationType(user, type)
                    .orElseGet(() -> notificationRepository.save(Notification.builder()
                            .user(user)
                            .notificationType(type)
                            .isEnabled(true)
                            .build()));
        }
    }

}
