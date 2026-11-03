package com.example.ezpay.controller.admin;

import com.example.ezpay.modules.kafka.dto.FailedEventInfo;
import com.example.ezpay.modules.kafka.service.FailedEventRetryService;
import com.example.ezpay.shared.common.dto.CommonResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

import java.util.List;

@RestController
@RequestMapping("/admin/failed-events")
@RequiredArgsConstructor
@ConditionalOnProperty(name = "ezpay.kafka.enabled", havingValue = "true")
public class AdminFailedEventController {

    private final FailedEventRetryService retryService;

    @GetMapping
    public ResponseEntity<CommonResponse<List<FailedEventInfo>>> getFailedEvents() {
        return ResponseEntity.ok(new CommonResponse<>(
                "success", retryService.getFailedEvents(), "실패 이벤트 조회 성공"));
    }

    @PostMapping("/{id}/retry")
    public ResponseEntity<CommonResponse<FailedEventInfo>> retry(@PathVariable Long id) {
        return ResponseEntity.ok(new CommonResponse<>(
                "success", retryService.retry(id), "실패 이벤트 재처리 요청 완료"));
    }
}
