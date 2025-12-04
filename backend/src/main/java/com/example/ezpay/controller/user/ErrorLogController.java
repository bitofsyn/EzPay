package com.example.ezpay.controller.user;

import com.example.ezpay.request.ErrorLogRequest;
import com.example.ezpay.shared.common.dto.CommonResponse;
import com.example.ezpay.response.ErrorLogResponse;
import com.example.ezpay.service.user.ErrorLogService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/error-logs")
@RequiredArgsConstructor
public class ErrorLogController {
    private final ErrorLogService errorLogService;

    // 장애 로그 저장
    @PostMapping
    public ResponseEntity<CommonResponse<ErrorLogResponse>> saveErrorLog(@RequestBody ErrorLogRequest request) {
        ErrorLogResponse response = errorLogService.saveErrorLog(request);
        return ResponseEntity.ok(new CommonResponse<>("success", response, "장애 로그 저장 완료"));
    }

    // 장애 로그 조회
    @GetMapping
    public ResponseEntity<CommonResponse<List<ErrorLogResponse>>> getAllErrorLogs() {
        return ResponseEntity.ok(new CommonResponse<>("success", errorLogService.getAllErrorLogs(), "장애 로그 조회 성공"));
    }

    // 특정 장애 로그 조회
    @GetMapping("/{id}")
    public ResponseEntity<CommonResponse<ErrorLogResponse>> getErrorLog(@PathVariable Long id) {
        try {
            ErrorLogResponse response = errorLogService.getErrorLog(id);
            return ResponseEntity.ok(new CommonResponse<>("success", response, "장애 로그 조회 성공"));
        }catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new CommonResponse<>("error", null, "장애 로그를 찾을 수 없습니다."));
        }
    }

    // 장애 로그 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<CommonResponse<Void>> deleteErrorLog(@PathVariable Long id) {
        try {
            errorLogService.deleteErrorLog(id);
            return ResponseEntity.ok(new CommonResponse<>("success", null, "장애 로그 삭제 성공"));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new CommonResponse<>("error", null, "삭제할 장애 로그를 찾을 수 없습니다."));
        }
    }

    // 장애 해결시 상태 변경
    @PutMapping("/{id}/resolve")
    public ResponseEntity<CommonResponse<Void>> resolveErrorLog(@PathVariable Long id) {
        try {
            errorLogService.resolveErrorLog(id);
            return ResponseEntity.ok(new CommonResponse<>("success", null, "장애 로그 해결 완료"));
        }catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new CommonResponse<>("error", null, "해결할 장애 로그를 찾을 수 없습니다."));
        }
    }
}
