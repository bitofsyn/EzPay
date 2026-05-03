package com.example.ezpay.repository.admin;

import com.example.ezpay.model.admin.AdminMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdminMessageRepository extends JpaRepository<AdminMessage, Long> {

    // 최신 메시지 조회 (최근 순 정렬)
    List<AdminMessage> findAllByOrderByCreatedAtDesc();

    // 읽지 않은 메시지 조회
    List<AdminMessage> findByIsReadFalseOrderByCreatedAtDesc();

    // 읽지 않은 메시지 개수
    long countByIsReadFalse();

    // 모든 메시지 읽음 처리
    @Modifying
    @Query("UPDATE AdminMessage m SET m.isRead = true WHERE m.isRead = false")
    void markAllAsRead();

    // 최근 N개 메시지 조회
    @Query(value = "SELECT * FROM admin_messages m ORDER BY m.created_at DESC LIMIT :limit", nativeQuery = true)
    List<AdminMessage> findRecentMessages(int limit);

    // 특정 발신자의 메시지 조회
    List<AdminMessage> findBySender_UserIdOrderByCreatedAtDesc(Long senderId);
}
