package com.example.ezpay.shared.exception;

import com.example.ezpay.shared.common.dto.CommonResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSourceResolvable;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.security.access.AccessDeniedException;

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

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<CommonResponse<Object>> handleAccessDeniedException(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new CommonResponse<>("error", null, ex.getMessage()));
    }

    // 요청 형식 오류는 클라이언트 오류(400)다. 아래 catch-all 에 걸려 500 으로 응답되던 것을 바로잡는다.
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<CommonResponse<Object>> handleMissingParameter(MissingServletRequestParameterException ex) {
        return clientError(HttpStatus.BAD_REQUEST,
                String.format("필수 요청 파라미터 '%s'가 없습니다.", ex.getParameterName()), ex);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<CommonResponse<Object>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return clientError(HttpStatus.BAD_REQUEST,
                String.format("요청 파라미터 '%s'의 형식이 올바르지 않습니다.", ex.getName()), ex);
    }

    // @RequestParam 등에 건 제약(@Min·@Max 등) 위반
    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<CommonResponse<Object>> handleMethodValidation(HandlerMethodValidationException ex) {
        String message = ex.getAllErrors().stream()
                .map(MessageSourceResolvable::getDefaultMessage)
                .filter(m -> m != null && !m.isBlank())
                .findFirst()
                .orElse("입력값이 올바르지 않습니다.");
        return clientError(HttpStatus.BAD_REQUEST, message, ex);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<CommonResponse<Object>> handleUnreadableBody(HttpMessageNotReadableException ex) {
        return clientError(HttpStatus.BAD_REQUEST, "요청 본문을 읽을 수 없습니다.", ex);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<CommonResponse<Object>> handleGenericException(Exception ex) {
        // 없는 경로(404)·허용되지 않은 메서드(405)·미지원 미디어 타입(415) 등 Spring MVC 가 상태 코드를 정해 둔
        // 클라이언트 오류는 그 상태 그대로 응답한다.
        if (ex instanceof ErrorResponse errorResponse && errorResponse.getStatusCode().is4xxClientError()) {
            HttpStatusCode status = errorResponse.getStatusCode();
            return clientError(status, clientErrorMessage(status), ex);
        }
        log.error("처리되지 않은 예외 발생", ex);
        CommonResponse<Object> response = new CommonResponse<>(
                "error", null, "An unexpected error occurred"
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    private ResponseEntity<CommonResponse<Object>> clientError(HttpStatusCode status, String message, Exception ex) {
        log.warn("잘못된 요청 [{}]: {}", status.value(), ex.getMessage());
        return ResponseEntity.status(status).body(new CommonResponse<>("error", null, message));
    }

    private String clientErrorMessage(HttpStatusCode status) {
        return switch (status.value()) {
            case 404 -> "요청한 경로를 찾을 수 없습니다.";
            case 405 -> "지원하지 않는 HTTP 메서드입니다.";
            case 415 -> "지원하지 않는 요청 형식입니다.";
            default -> "잘못된 요청입니다.";
        };
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

    // 소셜 로그인(OAuth) 제공자 통신/프로토콜 실패
    @ExceptionHandler(OAuthAuthenticationException.class)
    public ResponseEntity<CommonResponse<Object>> handleOAuthAuthenticationException(OAuthAuthenticationException ex) {
        log.warn("소셜 로그인 실패: {}", ex.getMessage());
        CommonResponse<Object> response = new CommonResponse<>(
                "error", null, ex.getMessage()
        );
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

}
