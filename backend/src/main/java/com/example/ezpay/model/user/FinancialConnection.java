package com.example.ezpay.model.user;

import com.example.ezpay.shared.common.enums.FinancialDataProvider;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.sql.Timestamp;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "financial_connections", indexes = {
        @Index(name = "idx_financial_connections_user_provider", columnList = "user_id,provider"),
        @Index(name = "idx_financial_connections_reference", columnList = "connectionReference", unique = true)
})
public class FinancialConnection {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long connectionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private FinancialDataProvider provider;

    @Column(nullable = false, unique = true, length = 100)
    private String connectionReference;

    @Column(length = 100)
    private String providerAccountReference;

    @Column(columnDefinition = "TEXT")
    @JsonIgnore
    private String accessToken;

    @Column(columnDefinition = "TEXT")
    @JsonIgnore
    private String refreshToken;

    @Column(length = 100)
    private String userSeqNo;

    @Column(length = 100)
    private String fintechUseNum;

    @Column(length = 3)
    private String selectedBankCodeStd;

    @Column(length = 20)
    private String selectedAccountNum;

    @Column(length = 3)
    private String selectedAccountSeq;

    @Column(length = 100)
    private String selectedAccountName;

    @Column(length = 7)
    private String selectedAccountLocalCode;

    @Column(length = 100)
    private String tokenType;

    @Column(length = 100)
    private String tokenScope;

    private Long accessTokenExpiresIn;

    @Column(columnDefinition = "TEXT")
    @JsonIgnore
    private String authorizationCode;

    @Column(length = 255)
    private String authorizationState;

    private Timestamp authorizationReceivedAt;
    private Timestamp tokenExchangedAt;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(length = 255)
    private String lastErrorMessage;

    @Column(length = 255)
    private String syncCursor;

    private Timestamp lastSyncedAt;

    @CreationTimestamp
    @Column(updatable = false)
    private Timestamp createdAt;

    @UpdateTimestamp
    private Timestamp updatedAt;
}
