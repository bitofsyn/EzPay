package com.example.ezpay.service.user;

import com.example.ezpay.shared.common.enums.ErrorLogStatus;

public interface ErrorLogService {
    void deleteErrorLog(Long errorLogId);

    // 장애 발생시 자동으로 로그 추가
    void logError(String serviceName, String errorMessage, ErrorLogStatus status);

    // 장애 해결시 상태 변경
    void resolveErrorLog(Long errorLogId);
}
