package com.example.ezpay.modules.kafka.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
@Table(name = "failed_event_log")
public class FailedEventLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String topic;

    @Column(name = "kafka_key")
    private String kafkaKey;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String payload;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String errorMessage;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime occurredAt;

    @Builder
    public FailedEventLog(String topic, String kafkaKey, String payload, String errorMessage) {
        this.topic = topic;
        this.kafkaKey = kafkaKey;
        this.payload = payload;
        this.errorMessage = errorMessage;
    }
}
