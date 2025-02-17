package com.example.ezpay.model.user;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

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

    @Column(nullable = false, precision = 18, scale = 4)
    private BigDecimal balance; // 잔액

    @CreationTimestamp
    private Timestamp createdAt;
}
