package com.example.ezpay.modules.realtime.dto;

import com.example.ezpay.shared.common.enums.Status;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// SSE 채널 "user-events"로 전송되는 사용자 상태 변경 이벤트.
// 사용자 페이지/관리자 액션으로 사용자 상태가 바뀌면 관리자 화면(사용자 관리, 대시보드)이
// 새로고침 없이 해당 사용자 행/지표를 즉시 갱신할 수 있도록 최소 정보를 담는다.
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RealtimeUserEvent {

    private Long userId;              // 대상 사용자 ID
    private String name;              // 사용자 이름(표시용)
    private Status status;            // 변경된 최신 상태 (ACTIVE/INACTIVE/LOCKED)
    private String action;            // 이벤트 종류 (예: STATUS_CHANGED)
    private LocalDateTime occurredAt; // 이벤트 발생 시각

    public static RealtimeUserEvent statusChanged(Long userId, String name, Status status) {
        return RealtimeUserEvent.builder()
                .userId(userId)
                .name(name)
                .status(status)
                .action("STATUS_CHANGED")
                .occurredAt(LocalDateTime.now())
                .build();
    }
}
