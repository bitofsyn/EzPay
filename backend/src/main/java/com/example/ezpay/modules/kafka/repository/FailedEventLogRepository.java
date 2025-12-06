package com.example.ezpay.modules.kafka.repository;

import com.example.ezpay.modules.kafka.entity.FailedEventLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FailedEventLogRepository extends JpaRepository<FailedEventLog, Long> {
}
