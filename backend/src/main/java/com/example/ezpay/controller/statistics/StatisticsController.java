package com.example.ezpay.controller.statistics;

import com.example.ezpay.modules.statistics.internal.service.StatisticsService;
import com.example.ezpay.modules.user.api.dto.UserInfo;
import com.example.ezpay.modules.user.api.facade.UserFacade;
import com.example.ezpay.response.SpendingSummaryDto;
import com.example.ezpay.shared.common.dto.CommonResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/statistics")
@RequiredArgsConstructor
public class StatisticsController {

    private final StatisticsService statisticsService;
    private final UserFacade userFacade;

@GetMapping("/spending-summary")
    public ResponseEntity<CommonResponse<List<SpendingSummaryDto>>> getSpendingSummary(
            // Authentication authentication, // TODO: 개발 완료 후 인증 로직 복구
            @RequestParam("user_id") Long userId,
            @RequestParam("year") int year,
            @RequestParam("month") int month) {

        // // 1. 인증 정보로부터 사용자 이메일 획득
        // String email = authentication.getName();

        // // 2. 이메일을 사용하여 사용자 정보(ID 포함) 조회
        // UserInfo user = userFacade.getUserByEmail(email);

        // 3. 서비스 호출하여 지출 내역 요약 조회
        List<SpendingSummaryDto> summary = statisticsService.getSpendingSummary(userId, year, month);

        // 4. 성공 응답 반환
        return ResponseEntity.ok(new CommonResponse<>("success", summary, "월별 지출 내역 조회 성공"));
    }
}
