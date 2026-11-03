package com.example.ezpay.controller.user;

import com.example.ezpay.request.ErrorLogRequest;
import com.example.ezpay.shared.common.dto.CommonResponse;
import com.example.ezpay.response.ErrorLogResponse;
import com.example.ezpay.service.user.ErrorLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

}
