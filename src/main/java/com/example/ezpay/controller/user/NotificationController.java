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
    @GetMapping("{userId}")
    public ResponseEntity<CommonResponse<List<NotificationResponse>>> getUserNotifications(@PathVariable Long userId) {
        try {
            List<NotificationResponse> notifications = notificationService.getUserNotifications(userId);
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
            return ResponseEntity.status(404).body(new CommonResponse<>("error", null, "알림 설정 수정 실패"));
        }
    }

}
