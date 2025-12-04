package com.example.ezpay.repository.user;

import com.example.ezpay.shared.common.enums.NotificationType;
import com.example.ezpay.model.user.Notification;
import com.example.ezpay.model.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    // FETCH JOIN 진행
    @Query("SELECT n FROM Notification n JOIN FETCH n.user WHERE n.user.userId = :userId")
    List<Notification> findByUserId(@Param("userId") Long userId);
    Optional<Notification> findByUserAndNotificationType(User user, NotificationType notificationType);
    void deleteByUser(User user);
}
