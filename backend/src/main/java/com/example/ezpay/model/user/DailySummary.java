package com.example.ezpay.model.user;

import com.example.ezpay.response.DailyDetailResponse;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
// 날짜별 수입/지출 합계
public class DailySummary {
    private String date;
    private Long income; // 총 수입 합계
    private Long expense; // 총 지출 합계
    private List<DailyDetail> details;
    private List<CategoryAmount> categoryAmounts;
}
