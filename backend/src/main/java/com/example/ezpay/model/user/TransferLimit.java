package com.example.ezpay.model.user;


import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "transferLimits")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransferLimit {
    @Id
    @Column(name="user_id")
    private Long userId;

    // 응답에는 userId 만 내보낸다. User 전체를 직렬화하면 비밀번호 해시와 지연 로딩 컬렉션(accounts)까지 따라 나간다.
    @JsonIgnore
    @OneToOne
    @MapsId
    @JoinColumn(name = "user_id", referencedColumnName = "user_id", nullable = false)
    private User user;

    private BigDecimal dailyLimit; // 하루 송금 한도
    private BigDecimal perTransactionLimit; // 건당 송금 한도
}
