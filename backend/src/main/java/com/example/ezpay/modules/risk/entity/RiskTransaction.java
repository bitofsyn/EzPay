package com.example.ezpay.modules.risk.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(
        name = "risk_transactions",
        indexes = {
                @Index(name = "idx_risk_transactions_transaction_id", columnList = "transactionId")
        }
)
public class RiskTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 64)
    private String transactionId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private RiskLevel level;

    @Column(nullable = false)
    private String sender;

    @Column(nullable = false)
    private String receiver;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(nullable = false)
    private LocalDateTime transactionDatetime;

    private String category;

    @Column(length = 500)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private RiskTransactionStatus status;

    private LocalDateTime approvedAt;

    @Builder
    public RiskTransaction(String transactionId, RiskLevel level, String sender, String receiver,
                            BigDecimal amount, LocalDateTime transactionDatetime, String category,
                            String reason, RiskTransactionStatus status) {
        this.transactionId = transactionId;
        this.level = level;
        this.sender = sender;
        this.receiver = receiver;
        this.amount = amount;
        this.transactionDatetime = transactionDatetime;
        this.category = category;
        this.reason = reason;
        this.status = status;
    }

    public void approve() {
        this.status = RiskTransactionStatus.APPROVED;
        this.approvedAt = LocalDateTime.now();
    }

    public void block() {
        this.status = RiskTransactionStatus.BLOCKED;
        this.approvedAt = LocalDateTime.now();
    }
}
