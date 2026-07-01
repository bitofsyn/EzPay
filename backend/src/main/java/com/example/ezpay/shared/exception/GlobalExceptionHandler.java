package com.example.ezpay.shared.exception;

import com.example.ezpay.shared.common.dto.CommonResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

// 전역 예외 처리
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // @Valid 검증 실패 처리
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<CommonResponse<Object>> handleValidationException(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getDefaultMessage())
                .orElse("입력값이 올바르지 않습니다.");
        CommonResponse<Object> response = new CommonResponse<>(
                "error", null, message
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<CommonResponse<Object>> handleIllegalArgumentException(IllegalArgumentException ex) {
        CommonResponse<Object> response = new CommonResponse<>(
                "error", null, ex.getMessage()
        );
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<CommonResponse<Object>> handleGenericException(Exception ex) {
        log.error("처리되지 않은 예외 발생", ex);
        CommonResponse<Object> response = new CommonResponse<>(
                "error", null, "An unexpected error occurred"
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    // 사용자 정의 예외 처리
    @ExceptionHandler(CustomNotFoundException.class)
    public ResponseEntity<CommonResponse<Object>> handleCustomNotFoundException(CustomNotFoundException ex) {
        CommonResponse<Object> response = new CommonResponse<>(
                "error", null, ex.getMessage()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(TransferLimitExceededException.class)
    public ResponseEntity<CommonResponse<String>> handleTransferLimitExceededException(TransferLimitExceededException e) {
        return ResponseEntity.badRequest().body(new CommonResponse<>("error", e.getMessage(), "TRANSFER_LIMIT_EXCEEDED"));
    }

}
