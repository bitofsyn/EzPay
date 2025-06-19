package com.example.ezpay.controller.user;

import com.example.ezpay.request.NotificationRequest;
import com.example.ezpay.response.CommonResponse;
import com.example.ezpay.response.NotificationResponse;
import com.example.ezpay.service.user.NotificationService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;

    // 사용자 알림 설정 조회
    @GetMapping("/{userId}")
    public ResponseEntity<CommonResponse<List<NotificationResponse>>> getUserNotifications(@PathVariable Long userId) {
        try {
            List<NotificationResponse> notifications = notificationService.getUserNotifications(userId);
            if (notifications.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NO_CONTENT).body(new CommonResponse<>("success", null, "등록된 알림이 없습니다."));
            }
            return ResponseEntity.ok(new CommonResponse<>("success", notifications, "알림 설정 조회 성공"));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new CommonResponse<>("error", null, "사용자를 찾을 수 없습니다."));
        }
    }

    // 사용자 알림 설정 변경
    @PutMapping("/{userId}")
    public ResponseEntity<CommonResponse<NotificationResponse>> updateUserNotifications(@PathVariable Long userId,
                                                                                        @RequestBody NotificationRequest notificationRequest) {
        try {
            NotificationResponse response = notificationService.updateNotification(userId, notificationRequest);
            return ResponseEntity.ok(new CommonResponse<>("success", response, "알림 설정 수정 성공"));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(404).body(new CommonResponse<>("error", null, "해당 알림 설정을 찾을 수 없습니다."));
        }
    }

    // 사용자 알림 삭제
    @DeleteMapping("/{notificationId}")
    public ResponseEntity<CommonResponse<Void>> deleteNotification(@PathVariable Long notificationId) {
        try {
            notificationService.deleteNotification(notificationId);
            return ResponseEntity.ok(new CommonResponse<>("success", null, "알림 삭제 성공"));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(404).body(new CommonResponse<>("error", null, "알림을 찾을 수 없습니다."));
        }
    }
}
