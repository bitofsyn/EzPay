package com.example.ezpay.repository.admin;

import com.example.ezpay.model.admin.AdminAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdminAlertRepository extends JpaRepository<AdminAlert, Long> {

    // 최신 알림 조회 (최근 순 정렬)
    List<AdminAlert> findAllByOrderByCreatedAtDesc();

    // 읽지 않은 알림 조회
    List<AdminAlert> findByIsReadFalseOrderByCreatedAtDesc();

    // 읽지 않은 알림 개수
    long countByIsReadFalse();

    // 모든 알림 읽음 처리
    @Modifying
    @Query("UPDATE AdminAlert a SET a.isRead = true WHERE a.isRead = false")
    void markAllAsRead();

    // 최근 N개 알림 조회
    @Query(value = "SELECT * FROM admin_alerts a ORDER BY a.created_at DESC LIMIT :limit", nativeQuery = true)
    List<AdminAlert> findRecentAlerts(int limit);
}
