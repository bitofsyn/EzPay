package com.example.ezpay.service.user.impl;

import com.example.ezpay.shared.common.enums.ErrorLogStatus;
import com.example.ezpay.model.user.ErrorLog;
import com.example.ezpay.repository.user.ErrorLogRepository;
import com.example.ezpay.service.user.ErrorLogService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ErrorLogServiceImpl implements ErrorLogService {
    private final ErrorLogRepository errorLogRepository;

    @Override
    @Transactional
    public void deleteErrorLog(Long errorLogId) {
        if (!errorLogRepository.existsById(errorLogId)) {
            throw new EntityNotFoundException("삭제할 장애 로그를 찾을 수 없습니다.");
        }
        errorLogRepository.deleteById(errorLogId);
    }


    // 장애 발생시 로그 추가
    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW) // 💡 별도 트랜잭션 적용
    public void logError(String serviceName, String errorMessage, ErrorLogStatus status) {
        ErrorLog log = ErrorLog.builder()
                .serviceName(serviceName)
                .errorMessage(errorMessage)
                .status(status)
                .build();
        errorLogRepository.save(log);
    }


    // 장애 해결시 상태 변경
    @Override
    @Transactional
    public void resolveErrorLog(Long errorLogId) {
        ErrorLog errorLog = errorLogRepository.findById(errorLogId)
                .orElseThrow(() -> new EntityNotFoundException("해결할 장애 로그를 찾을 수 없습니다."));

        if (errorLog.getStatus() == ErrorLogStatus.RESOLVED) {
            throw new IllegalStateException("이미 해결된 장애 로그입니다.");
        }

        errorLog.setStatus(ErrorLogStatus.RESOLVED);
        errorLogRepository.save(errorLog);
    }

}
