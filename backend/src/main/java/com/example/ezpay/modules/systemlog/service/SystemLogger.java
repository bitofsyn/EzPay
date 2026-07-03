package com.example.ezpay.modules.systemlog.service;

import com.example.ezpay.modules.systemlog.entity.LogLevel;
import com.example.ezpay.modules.systemlog.entity.SystemLog;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * 관리자 시스템 로그를 남기는 편의 컴포넌트.
 *
 * <p>{@link SystemLogService#save}가 별도 트랜잭션(REQUIRES_NEW)으로 커밋하므로 호출측 트랜잭션과
 * 독립적으로 로그가 남고, 로그 저장 실패가 호출측(송금·인증 등)을 오염시키지 않는다.
 * 로그 적재는 부가 기능이므로 여기서 예외를 삼켜 주 흐름에 영향을 주지 않는다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SystemLogger {

    private final SystemLogService systemLogService;

    public void info(String service, String message) {
        save(LogLevel.INFO, service, message);
    }

    public void warn(String service, String message) {
        save(LogLevel.WARN, service, message);
    }

    public void error(String service, String message) {
        save(LogLevel.ERROR, service, message);
    }

    private void save(LogLevel level, String service, String message) {
        try {
            systemLogService.save(SystemLog.builder()
                    .logTime(LocalDateTime.now())
                    .level(level)
                    .service(service)
                    .message(message)
                    .build());
        } catch (Exception ex) {
            log.warn("시스템 로그 적재 실패(무시): {}", ex.getMessage());
        }
    }
}
