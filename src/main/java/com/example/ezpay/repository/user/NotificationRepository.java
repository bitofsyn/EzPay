package com.example.ezpay.repository.user;

import com.example.ezpay.model.enums.NotificationType;
import com.example.ezpay.model.user.Notification;
import com.example.ezpay.model.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUser(User user);

    Optional<Notification> findByUserAndNotificationType(User user, NotificationType notificationType);
}
