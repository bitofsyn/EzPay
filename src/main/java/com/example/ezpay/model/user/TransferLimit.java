package com.example.ezpay.model.user;


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

    @OneToOne
    @MapsId
    @JoinColumn(name = "user_id", referencedColumnName = "user_id", nullable = false)
    private User user;

    private BigDecimal dailyLimit; // 하루 송금 한도
    private BigDecimal perTransactionLimit; // 건당 송금 한도
}
