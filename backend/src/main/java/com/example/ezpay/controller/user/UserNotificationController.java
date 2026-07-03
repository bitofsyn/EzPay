package com.example.ezpay.controller.user;

import com.example.ezpay.modules.notification.api.dto.UserNotificationPage;
import com.example.ezpay.modules.notification.internal.service.UserNotificationService;
import com.example.ezpay.modules.notification.internal.service.UserNotificationServiceImpl;
import com.example.ezpay.modules.realtime.sse.SseEmitterRegistry;
import com.example.ezpay.modules.user.api.facade.UserFacade;
import com.example.ezpay.shared.common.dto.CommonResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

/**
 * 사용자 알림 피드 API.
 * 송금/입금/보안 등 실제 알림 이벤트를 조회·읽음처리하고, SSE로 실시간 구독한다.
 */
@RestController
@RequestMapping("/user-notifications")
@RequiredArgsConstructor
public class UserNotificationController {

    private final UserNotificationService userNotificationService;
    private final UserFacade userFacade;
    private final SseEmitterRegistry sseEmitterRegistry;

    // 알림 피드 조회 (페이지네이션, 기본 10개)
    @GetMapping
    public ResponseEntity<CommonResponse<UserNotificationPage>> getFeed(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = resolveUserId(authentication);
        UserNotificationPage feed = userNotificationService.getFeed(userId, page, size);
        return ResponseEntity.ok(new CommonResponse<>("success", feed, "알림 조회 성공"));
    }

    // 미확인 알림 수
    @GetMapping("/unread-count")
    public ResponseEntity<CommonResponse<Map<String, Long>>> getUnreadCount(Authentication authentication) {
        Long userId = resolveUserId(authentication);
        long count = userNotificationService.getUnreadCount(userId);
        return ResponseEntity.ok(new CommonResponse<>("success", Map.of("unreadCount", count), "미확인 알림 수 조회 성공"));
    }

    // 단건 읽음 처리
    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<CommonResponse<Void>> markRead(Authentication authentication,
                                                         @PathVariable Long notificationId) {
        Long userId = resolveUserId(authentication);
        try {
            userNotificationService.markRead(userId, notificationId);
            return ResponseEntity.ok(new CommonResponse<>("success", null, "알림 읽음 처리 성공"));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new CommonResponse<>("error", null, e.getMessage()));
        }
    }

    // 전체 읽음 처리
    @PatchMapping("/read-all")
    public ResponseEntity<CommonResponse<Void>> markAllRead(Authentication authentication) {
        Long userId = resolveUserId(authentication);
        userNotificationService.markAllRead(userId);
        return ResponseEntity.ok(new CommonResponse<>("success", null, "전체 읽음 처리 성공"));
    }

    // 실시간 스트림 (EventSource, ?token= 으로 인증)
    @GetMapping("/stream")
    public SseEmitter stream(Authentication authentication) {
        Long userId = resolveUserId(authentication);
        return sseEmitterRegistry.register(UserNotificationServiceImpl.channel(userId));
    }

    // JWT(email) → userId
    private Long resolveUserId(Authentication authentication) {
        String email = ((UserDetails) authentication.getPrincipal()).getUsername();
        return userFacade.getUserByEmail(email).getUserId();
    }
}
