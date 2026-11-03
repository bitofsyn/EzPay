package com.example.ezpay.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
@AllArgsConstructor
public class DailySummaryResponse {
    private LocalDate date;
    private Long income; // 총 수입 합계
    private Long expense; // 총 지출 합계
    private List<DailyDetailResponse> details;
    private List<CategoryAmountResponse> categories;
}
