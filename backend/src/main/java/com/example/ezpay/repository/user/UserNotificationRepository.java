package com.example.ezpay.repository.user;

import com.example.ezpay.model.user.UserNotification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserNotificationRepository extends JpaRepository<UserNotification, Long> {

    // 알림 페이지 조회 (최신순)
    Page<UserNotification> findByUser_UserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    // 미확인 알림 수
    long countByUser_UserIdAndIsReadFalse(Long userId);

    // 특정 사용자의 알림 단건 (권한 확인용)
    Optional<UserNotification> findByNotificationIdAndUser_UserId(Long notificationId, Long userId);

    @Modifying
    @Query("UPDATE UserNotification n SET n.isRead = true WHERE n.user.userId = :userId AND n.isRead = false")
    int markAllReadByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("DELETE FROM UserNotification n WHERE n.user.userId = :userId")
    void deleteByUser_UserId(@Param("userId") Long userId);
}
