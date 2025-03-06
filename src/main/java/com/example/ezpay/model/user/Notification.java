package com.example.ezpay.model.user;

import com.example.ezpay.model.enums.NotificationType;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.sql.Timestamp;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notification_id")
    private Long notificationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore // JSON 변환시 user 필드 제외
    private User user;

    @Enumerated(EnumType.STRING)
    private NotificationType notificationType;
    private Boolean isEnabled;

    @CreationTimestamp
    private Timestamp createdAt;
}
