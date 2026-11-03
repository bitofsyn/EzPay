package com.example.ezpay.response;

import com.example.ezpay.model.user.LoginHistory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.sql.Timestamp;

@Data
@Builder
@AllArgsConstructor
public class LoginHistoryResponse {
    private String ip;
    private String device;
    private Timestamp timestamp;

    public static LoginHistoryResponse from(LoginHistory loginHistory) {
        return LoginHistoryResponse.builder()
                .ip(loginHistory.getIp())
                .device(loginHistory.getDevice())
                .timestamp(loginHistory.getTimestamp())
                .build();
    }
}
