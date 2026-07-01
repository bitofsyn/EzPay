package com.example.ezpay.controller.admin;

import com.example.ezpay.modules.systemlog.dto.SystemLogInfo;
import com.example.ezpay.modules.systemlog.service.SystemLogService;
import com.example.ezpay.shared.common.dto.CommonResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// 프론트엔드 logsApi.ts가 기대하는 시스템 로그 조회 API
@RestController
@RequestMapping("/admin/system-logs")
@RequiredArgsConstructor
public class AdminSystemLogController {

    private final SystemLogService systemLogService;

    @GetMapping
    public ResponseEntity<CommonResponse<List<SystemLogInfo>>> getSystemLogs(
            @RequestParam(defaultValue = "30") int limit) {
        List<SystemLogInfo> logs = systemLogService.getRecentLogs(limit);
        return ResponseEntity.ok(new CommonResponse<>("success", logs, "시스템 로그 조회 성공"));
    }
}
