package com.example.ezpay.repository.user;

import com.example.ezpay.model.enums.ErrorLogStatus;
import com.example.ezpay.model.user.ErrorLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ErrorLogRepository extends JpaRepository<ErrorLog, Long> {
    List<ErrorLog> findByStatus(ErrorLogStatus status); // 특정 상태의 장애 로그 조회
}
