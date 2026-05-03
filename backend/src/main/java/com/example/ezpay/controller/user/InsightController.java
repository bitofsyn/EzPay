package com.example.ezpay.controller.user;

import com.example.ezpay.modules.insight.api.dto.InsightResponse;
import com.example.ezpay.modules.insight.internal.service.InsightService;
import com.example.ezpay.shared.common.dto.CommonResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/insights")
@RequiredArgsConstructor
public class InsightController {
    private final InsightService insightService;

    @GetMapping
    public ResponseEntity<CommonResponse<List<InsightResponse>>> getInsights(@RequestParam Long userId) {
        List<InsightResponse> insights = insightService.generateInsights(userId);
        return ResponseEntity.ok(new CommonResponse<>("success", insights, "INSIGHTS_FETCHED"));
    }
}
