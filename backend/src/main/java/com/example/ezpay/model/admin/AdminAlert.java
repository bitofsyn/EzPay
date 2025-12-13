package com.example.ezpay.model.admin;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "admin_alerts")
public class AdminAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "alert_id")
    private Long alertId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AlertType alertType;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 500)
    private String message;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isRead = false;

    @CreationTimestamp
    private LocalDateTime createdAt;

    public enum AlertType {
        WARNING,    // 경고 (비정상 거래 감지 등)
        ERROR,      // 오류 (시스템 에러)
        INFO,       // 정보 (시스템 업데이트 등)
        SUCCESS     // 성공 (백업 완료 등)
    }
}
