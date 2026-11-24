package com.example.ezpay.controller.statistics;

import com.example.ezpay.modules.statistics.internal.service.StatisticsService;
import com.example.ezpay.modules.user.api.dto.UserInfo;
import com.example.ezpay.modules.user.api.facade.UserFacade;
import com.example.ezpay.response.SpendingSummaryDto;
import com.example.ezpay.shared.exception.GlobalExceptionHandler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 요청 형식 오류가 500 이 아니라 4xx 로 응답되는지 검증한다.
 * (GET /api/statistics/spending-summary 에서 year·month 를 빠뜨리면 500 이 나던 문제)
 */
class StatisticsControllerRequestErrorTest {

    private MockMvc mockMvc;
    private final TestingAuthenticationToken user = new TestingAuthenticationToken("user@example.com", null);

    @BeforeEach
    void setUp() {
        StatisticsService statisticsService = mock(StatisticsService.class);
        UserFacade userFacade = mock(UserFacade.class);
        when(userFacade.getUserByEmail("user@example.com"))
                .thenReturn(UserInfo.builder().userId(7L).email("user@example.com").build());
        when(statisticsService.getSpendingSummary(7L, 2026, 11))
                .thenReturn(List.of(new SpendingSummaryDto("식비", new BigDecimal("12000"))));

        mockMvc = MockMvcBuilders.standaloneSetup(new StatisticsController(statisticsService, userFacade))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void returnsSummaryWhenYearAndMonthAreGiven() throws Exception {
        mockMvc.perform(get("/api/statistics/spending-summary").param("year", "2026").param("month", "11")
                        .principal(user))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].category").value("식비"));
    }

    @Test
    void missingParameterIsBadRequest() throws Exception {
        mockMvc.perform(get("/api/statistics/spending-summary").param("month", "11").principal(user))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("필수 요청 파라미터 'year'가 없습니다."));
    }

    @Test
    void malformedParameterIsBadRequest() throws Exception {
        mockMvc.perform(get("/api/statistics/spending-summary").param("year", "abc").param("month", "11")
                        .principal(user))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("요청 파라미터 'year'의 형식이 올바르지 않습니다."));
    }

    @Test
    void outOfRangeMonthIsBadRequest() throws Exception {
        mockMvc.perform(get("/api/statistics/spending-summary").param("year", "2026").param("month", "13")
                        .principal(user))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("월은 1~12 사이여야 합니다."));
    }

    @Test
    void unsupportedMethodKeepsItsStatus() throws Exception {
        mockMvc.perform(post("/api/statistics/spending-summary").principal(user))
                .andExpect(status().isMethodNotAllowed());
    }
}
