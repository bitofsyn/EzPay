package com.example.ezpay.modules.notification.api.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

/**
 * 알림 피드 페이지 응답.
 */
@Getter
@AllArgsConstructor
public class UserNotificationPage {
    private List<UserNotificationInfo> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean hasNext;
}
