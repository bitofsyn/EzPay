package com.example.ezpay.shared.common.enums;

/**
 * 사용자 알림 피드(이벤트) 분류.
 * 설정용 {@link NotificationType}(EMAIL/PUSH)과는 별개로, 실제 알림 이벤트의 종류를 나타낸다.
 */
public enum UserNotificationCategory {
    TRANSFER,  // 송금 완료 (내가 보냄)
    DEPOSIT,   // 입금 확인 (내가 받음)
    SECURITY   // 보안 알림 (로그인 등)
}
