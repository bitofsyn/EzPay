package com.example.ezpay.modules.insight.api.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class InsightResponse {
    String type;
    String title;
    String summary;
    String severity;
    String evidenceLabel;
    String evidenceValue;
}
