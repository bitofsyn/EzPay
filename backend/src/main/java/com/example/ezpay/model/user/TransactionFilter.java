package com.example.ezpay.model.user;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDate;

@Entity
@Table(name = "transaction_filters")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionFilter {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "filter_id")
    private Long filterId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore // JSON 변환시 user 필드 제외
    private User user; // 사용자 ID 참조

    private LocalDate startDate; // 조회 시작 날짜
    private LocalDate endDate; // 조회 종료 날짜

    private BigDecimal minAmount; // 최소 금액
    private BigDecimal maxAmount; // 최대 금액

    @CreationTimestamp
    private Timestamp createdAt; // 요청 생성 시간
}
