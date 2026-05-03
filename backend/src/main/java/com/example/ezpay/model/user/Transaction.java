package com.example.ezpay.model.user;

import com.example.ezpay.shared.common.enums.TransactionStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.sql.Timestamp;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Builder
@Table(
        name = "transactions",
        indexes = {
                @Index(name = "idx_transactions_request_id", columnList = "requestId")
        },
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_transactions_request_id", columnNames = "requestId")
        }
)
public class Transaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long transactionId;

    @Column(length = 64)
    private String requestId;

    @ManyToOne
    @JoinColumn(name="sender_account_id", nullable=false)
    private Accounts senderAccount;

    @ManyToOne
    @JoinColumn(name="receiver_account_id", nullable=false)
    private Accounts receiverAccount;
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    private TransactionStatus status;

    @CreationTimestamp
    private Timestamp transactionDate;

    private String description;

    private String category;  // 거래 카테고리 (식비, 교통비, 쇼핑 등)

    private String memo;  // 거래 메모
}
