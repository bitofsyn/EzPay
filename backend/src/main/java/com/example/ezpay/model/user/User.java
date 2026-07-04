package com.example.ezpay.model.user;

import com.example.ezpay.shared.common.enums.AuthProvider;
import com.example.ezpay.shared.common.enums.Role;
import com.example.ezpay.shared.common.enums.Status;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.sql.Timestamp;
import java.util.List;

@Entity
@Table(name = "users")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;

    private String email;
    private String password;
    private String name;
    @Column(name = "phone_number")
    private String phoneNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Role role = Role.USER;

    /**
     * 가입 경로(LOCAL/KAKAO/NAVER). 기존 회원 레코드는 NULL일 수 있으며 LOCAL로 취급한다.
     * ddl-auto=update 환경이라 컬럼은 자동 추가된다. (NOT NULL 제약을 걸면 기존 행 때문에 마이그레이션이 실패하므로 nullable 유지)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "auth_provider")
    @Builder.Default
    private AuthProvider authProvider = AuthProvider.LOCAL;

    /**
     * 소셜 제공자가 발급한 고유 사용자 식별자. LOCAL 회원은 NULL.
     * (provider + socialId) 조합으로 소셜 사용자를 재식별한다.
     */
    @Column(name = "social_id")
    private String socialId;

    @CreationTimestamp
    @Column(updatable = false)
    private Timestamp createdAt;

    @UpdateTimestamp
    private Timestamp updatedAt;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference // 양방향 참조
    private List<Accounts> accounts;

    /**
     * NULL(마이그레이션 이전 회원)을 LOCAL로 보정해 반환한다.
     */
    public AuthProvider getAuthProviderOrLocal() {
        return authProvider == null ? AuthProvider.LOCAL : authProvider;
    }

    @Override
    public String toString() {
        return "User{" +
                "userId=" + userId +
                ", email='" + email + '\'' +
                ", password='" + password + '\'' +
                ", name='" + name + '\'' +
                ", status=" + status +
                ", role=" + role +
                ", authProvider=" + authProvider +
                ", socialId='" + socialId + '\'' +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                ", accounts=" + accounts +
                '}';
    }
}
