package com.example.ezpay.modules.notification.internal.repository;

import com.example.ezpay.modules.notification.internal.entity.EmailDelivery;
import com.example.ezpay.modules.notification.internal.entity.EmailDeliveryStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface EmailDeliveryRepository extends JpaRepository<EmailDelivery, Long> {
    List<EmailDelivery> findByStatusInAndNextRetryAtLessThanEqualOrderByCreatedAtAsc(
            Collection<EmailDeliveryStatus> statuses,
            LocalDateTime now,
            Pageable pageable
    );
}
