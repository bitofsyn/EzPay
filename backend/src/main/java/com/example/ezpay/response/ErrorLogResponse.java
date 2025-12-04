package com.example.ezpay.response;

import com.example.ezpay.shared.common.enums.ErrorLogStatus;
import com.example.ezpay.model.user.ErrorLog;
import lombok.Getter;

import java.sql.Timestamp;

@Getter
public class ErrorLogResponse {
    private Long logId;
    private String serviceName;
    private String errorMessage;
    private ErrorLogStatus status;
    private Timestamp occurredAt;


    public ErrorLogResponse(ErrorLog errorLog) {
        this.logId = errorLog.getLogId();
        this.serviceName = errorLog.getServiceName();
        this.errorMessage = errorLog.getErrorMessage();
        this.status = errorLog.getStatus();
        this.occurredAt = errorLog.getOccurredAt();
    }
}
