package com.example.ezpay.model.user;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
@Entity
@Table(name = "password_reset_requests")
public class PasswordReset {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long requestId;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String resetToken; // UUID토큰을 저장
    private LocalDateTime expirationTime; // 토큰 만료 여부확인
    @CreationTimestamp
    private LocalDateTime createdAt;
    private Boolean used;
}
