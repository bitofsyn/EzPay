package com.example.ezpay.model.user;

import com.example.ezpay.shared.common.enums.FinancialDataProvider;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.OffsetDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "normalized_transactions", indexes = {
        @Index(name = "idx_normalized_transactions_user_posted_at", columnList = "user_id,postedAt"),
        @Index(name = "idx_normalized_transactions_connection", columnList = "connection_id"),
        @Index(name = "idx_normalized_transactions_provider_tx", columnList = "provider,providerTransactionId", unique = true)
})
public class NormalizedTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long normalizedTransactionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "connection_id", nullable = false)
    private FinancialConnection connection;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private FinancialDataProvider provider;

    @Column(nullable = false, length = 150)
    private String providerTransactionId;

    @Column(length = 150)
    private String providerAccountId;

    private OffsetDateTime postedAt;

    private OffsetDateTime authorizedAt;

    @Column(nullable = false, precision = 18, scale = 4)
    private BigDecimal amount;

    @Column(length = 10)
    private String currencyCode;

    @Column(length = 30)
    private String direction;

    @Column(length = 120)
    private String merchantName;

    @Column(length = 255)
    private String description;

    @Column(length = 100)
    private String primaryCategory;

    @Column(length = 100)
    private String detailedCategory;

    @Column(nullable = false)
    private boolean pending;

    @Column(columnDefinition = "TEXT")
    private String rawPayload;

    @CreationTimestamp
    @Column(updatable = false)
    private Timestamp createdAt;
}
