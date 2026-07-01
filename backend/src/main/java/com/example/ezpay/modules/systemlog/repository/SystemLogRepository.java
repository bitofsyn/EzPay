package com.example.ezpay.modules.systemlog.repository;

import com.example.ezpay.modules.systemlog.entity.SystemLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SystemLogRepository extends JpaRepository<SystemLog, Long> {

    List<SystemLog> findAllByOrderByLogTimeDesc(Pageable pageable);
}
