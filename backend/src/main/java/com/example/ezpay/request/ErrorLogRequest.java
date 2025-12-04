package com.example.ezpay.request;

import com.example.ezpay.shared.common.enums.ErrorLogStatus;
import com.example.ezpay.model.user.ErrorLog;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ErrorLogRequest {
    private String serviceName;
    private String errorMessage;
    private ErrorLogStatus status;

    public ErrorLog toEntity() {
        return ErrorLog
                .builder()
                .serviceName(serviceName)
                .errorMessage(errorMessage)
                .status(status)
                .build();
    }
}
