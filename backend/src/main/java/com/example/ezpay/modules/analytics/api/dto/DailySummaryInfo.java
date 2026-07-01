package com.example.ezpay.modules.analytics.api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
@AllArgsConstructor
public class DailySummaryInfo {
    private LocalDate date;
    private Long income; // 총 수입 합계
    private Long expense; // 총 지출 합계
    private List<DailyDetailInfo> details;
    private List<CategoryAmountInfo> categories;
}
