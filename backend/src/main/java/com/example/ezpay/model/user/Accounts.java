package com.example.ezpay.model.user;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.sql.Timestamp;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "accounts", uniqueConstraints = {
        @UniqueConstraint(columnNames = "accountNumber") // 계좌번호 고유 설정
})
public class Accounts {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long accountId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="user_id", nullable = false)
    @JsonBackReference // 양방향 참조
    private User user; // 사용자와 연결

    @Column(nullable = false, unique = true)
    private String accountNumber;
    private String bankName;
    @Column(nullable = false)
    private boolean isMain; // 대표계좌

    @Column(nullable = false, precision = 18, scale = 4)
    private BigDecimal balance; // 잔액

    @CreationTimestamp
    @Column(updatable = false)
    private Timestamp createdAt;

    @UpdateTimestamp
    private Timestamp updatedAt;

    /**
     * 직렬화 전용: 계좌 소유자 이름.
     * 프론트가 거래 상대를 은행명이 아닌 사람 이름으로 표시할 수 있도록 노출한다.
     * user는 @JsonBackReference로 직렬화되지 않으므로 별도 파생 필드로 제공하며,
     * OSIV가 꺼진 컨텍스트의 지연로딩 예외에는 null로 방어한다.
     */
    @JsonProperty("ownerName")
    public String getOwnerName() {
        try {
            return user != null ? user.getName() : null;
        } catch (RuntimeException e) {
            return null;
        }
    }
}
