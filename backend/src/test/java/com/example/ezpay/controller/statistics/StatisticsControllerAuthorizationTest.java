package com.example.ezpay.controller.statistics;

import com.example.ezpay.controller.statistics.StatisticsController;
import com.example.ezpay.modules.statistics.internal.service.StatisticsService;
import com.example.ezpay.modules.user.api.dto.UserInfo;
import com.example.ezpay.modules.user.api.facade.UserFacade;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.TestingAuthenticationToken;

import java.util.List;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class StatisticsControllerAuthorizationTest {

    @Test
    void usesAuthenticatedUserInsteadOfRequestSuppliedUserId() {
        StatisticsService statisticsService = mock(StatisticsService.class);
        UserFacade userFacade = mock(UserFacade.class);
        StatisticsController controller = new StatisticsController(statisticsService, userFacade);
        TestingAuthenticationToken authentication =
                new TestingAuthenticationToken("user@example.com", null);
        when(userFacade.getUserByEmail("user@example.com"))
                .thenReturn(UserInfo.builder().userId(7L).email("user@example.com").build());
        when(statisticsService.getSpendingSummary(7L, 2026, 11)).thenReturn(List.of());

        controller.getSpendingSummary(authentication, 2026, 11);

        verify(statisticsService).getSpendingSummary(7L, 2026, 11);
    }
}
