package com.example.ezpay.controller.admin;

import com.example.ezpay.modules.admin.api.dto.ErrorLogInfo;
import com.example.ezpay.modules.admin.internal.service.AdminService;
import com.example.ezpay.shared.common.dto.CommonResponse;
import com.example.ezpay.shared.common.enums.ErrorLogStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/error-logs")
@RequiredArgsConstructor
public class AdminErrorLogController {
    private final AdminService adminService;

    // 모든 에러 로그 조회
    @GetMapping
    public ResponseEntity<CommonResponse<List<ErrorLogInfo>>> getAllErrorLogs() {
        List<ErrorLogInfo> errorLogs = adminService.getAllErrorLogs();
        return ResponseEntity.ok(new CommonResponse<>("success", errorLogs, "전체 에러 로그 조회 성공"));
    }

    // 특정 상태의 에러 로그 조회
    @GetMapping("/status/{status}")
    public ResponseEntity<CommonResponse<List<ErrorLogInfo>>> getErrorLogsByStatus(@PathVariable ErrorLogStatus status) {
        List<ErrorLogInfo> errorLogs = adminService.getErrorLogsByStatus(status);
        return ResponseEntity.ok(new CommonResponse<>("success", errorLogs, "에러 로그 조회 성공"));
    }

    // 에러 로그 해결 처리
    @PatchMapping("/{logId}/resolve")
    public ResponseEntity<CommonResponse<String>> resolveErrorLog(@PathVariable Long logId) {
        adminService.resolveErrorLog(logId);
        return ResponseEntity.ok(new CommonResponse<>("success", "에러 로그 해결 완료", "ERROR LOG RESOLVED"));
    }

    // 에러 로그 삭제
    @DeleteMapping("/{logId}")
    public ResponseEntity<CommonResponse<String>> deleteErrorLog(@PathVariable Long logId) {
        adminService.deleteErrorLog(logId);
        return ResponseEntity.ok(new CommonResponse<>("success", "에러 로그 삭제 완료", "ERROR LOG DELETED"));
    }
}
