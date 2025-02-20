package com.example.ezpay.model.user;

import com.example.ezpay.model.enums.ErrorLogStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.sql.Timestamp;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "error_logs")
public class ErrorLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id")
    private Long logId;

    private String serviceName; // 장애가 발생한 서비스명
    private String errorMessage; // 에러 메시지

    @CreationTimestamp
    private Timestamp occurredAt;

    @Enumerated(EnumType.STRING)
    private ErrorLogStatus status;
}
