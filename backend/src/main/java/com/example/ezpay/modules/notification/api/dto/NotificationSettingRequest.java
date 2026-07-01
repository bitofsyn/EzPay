package com.example.ezpay.modules.notification.api.dto;

import com.example.ezpay.shared.common.enums.NotificationType;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class NotificationSettingRequest {
    @NotNull(message = "알림 타입을 선택해주세요.")
    private NotificationType notificationType;

    @NotNull(message = "알림 활성화 여부를 입력해주세요.")
    private Boolean isEnabled;
}
