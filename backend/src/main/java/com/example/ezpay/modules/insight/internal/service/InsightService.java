package com.example.ezpay.modules.insight.internal.service;

import com.example.ezpay.modules.insight.api.dto.InsightResponse;

import java.util.List;

public interface InsightService {
    List<InsightResponse> generateInsights(Long userId);
}
