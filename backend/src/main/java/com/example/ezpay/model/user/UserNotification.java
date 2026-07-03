package com.example.ezpay.model.user;

import com.example.ezpay.shared.common.enums.UserNotificationCategory;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.sql.Timestamp;

/**
 * 사용자 알림 피드(이벤트) 엔티티.
 * 송금/입금/보안 등 실제 발생한 알림을 영구 저장한다.
 * (알림 on/off 설정은 별도 엔티티 {@link Notification})
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(
        name = "user_notifications",
        indexes = @Index(name = "idx_user_notifications_user_created", columnList = "user_id, createdAt")
)
public class UserNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_notification_id")
    private Long notificationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserNotificationCategory category;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, length = 255)
    private String message;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isRead = false;

    @CreationTimestamp
    @Column(updatable = false)
    private Timestamp createdAt;
}
