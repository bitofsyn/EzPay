package com.example.ezpay.controller.user;

import com.example.ezpay.modules.notification.api.dto.NotificationInfo;
import com.example.ezpay.modules.notification.api.dto.NotificationSettingRequest;
import com.example.ezpay.modules.notification.internal.service.NotificationService;
import com.example.ezpay.shared.common.dto.CommonResponse;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import com.example.ezpay.shared.security.CurrentUserService;

import java.util.List;

@RestController
@RequestMapping("notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;
    private final CurrentUserService currentUserService;

    // 사용자 알림 설정 조회
    @GetMapping("/{userId}")
    public ResponseEntity<CommonResponse<List<NotificationInfo>>> getUserNotifications(Authentication authentication,
                                                                                        @PathVariable Long userId) {
        currentUserService.requireUserId(authentication, userId);
        try {
            List<NotificationInfo> notifications = notificationService.getUserNotifications(userId);
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
    public ResponseEntity<CommonResponse<NotificationInfo>> updateUserNotifications(Authentication authentication,
                                                                                        @PathVariable Long userId,
                                                                                        @Valid @RequestBody NotificationSettingRequest notificationRequest) {
        currentUserService.requireUserId(authentication, userId);
        try {
            NotificationInfo response = notificationService.updateNotification(userId, notificationRequest);
            return ResponseEntity.ok(new CommonResponse<>("success", response, "알림 설정 수정 성공"));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(404).body(new CommonResponse<>("error", null, "해당 알림 설정을 찾을 수 없습니다."));
        }
    }

    // 사용자 알림 삭제
    @DeleteMapping("/{notificationId}")
    public ResponseEntity<CommonResponse<Void>> deleteNotification(Authentication authentication,
                                                                    @PathVariable Long notificationId) {
        try {
            notificationService.deleteNotification(currentUserService.getUserId(authentication), notificationId);
            return ResponseEntity.ok(new CommonResponse<>("success", null, "알림 삭제 성공"));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(404).body(new CommonResponse<>("error", null, "알림을 찾을 수 없습니다."));
        }
    }
}
