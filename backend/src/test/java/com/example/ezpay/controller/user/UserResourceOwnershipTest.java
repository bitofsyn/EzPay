package com.example.ezpay.controller.user;

import com.example.ezpay.model.user.Notification;
import com.example.ezpay.model.user.TransactionFilter;
import com.example.ezpay.model.user.User;
import com.example.ezpay.modules.account.internal.service.AccountService;
import com.example.ezpay.modules.analytics.internal.service.DashboardService;
import com.example.ezpay.modules.analytics.internal.service.TransactionStatisticsService;
import com.example.ezpay.modules.notification.internal.service.NotificationService;
import com.example.ezpay.modules.notification.internal.service.NotificationServiceImpl;
import com.example.ezpay.modules.payment.internal.service.TransactionFilterService;
import com.example.ezpay.modules.payment.internal.service.TransferLimitService;
import com.example.ezpay.modules.user.api.dto.UserInfo;
import com.example.ezpay.modules.user.api.facade.UserFacade;
import com.example.ezpay.repository.user.NotificationRepository;
import com.example.ezpay.repository.user.UserRepository;
import com.example.ezpay.shared.security.CurrentUserService;
import org.junit.jupiter.api.Test;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.TestingAuthenticationToken;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

class UserResourceOwnershipTest {

    private static final Long CURRENT_USER_ID = 1L;
    private static final Long OTHER_USER_ID = 2L;

    @Test
    void rejectsAnotherUsersNotificationSettings() {
        NotificationService notificationService = mock(NotificationService.class);
        NotificationController controller = new NotificationController(notificationService, currentUserService());

        assertThatThrownBy(() -> controller.getUserNotifications(authentication(), OTHER_USER_ID))
                .isInstanceOf(AccessDeniedException.class);
        verifyNoInteractions(notificationService);
    }

    @Test
    void rejectsAnotherUsersTransferLimit() {
        TransferLimitService transferLimitService = mock(TransferLimitService.class);
        TransferLimitController controller = new TransferLimitController(transferLimitService, currentUserService());

        assertThatThrownBy(() -> controller.readTransferLimit(authentication(), OTHER_USER_ID))
                .isInstanceOf(AccessDeniedException.class);
        verifyNoInteractions(transferLimitService);
    }

    @Test
    void rejectsAnotherUsersMonthlyStatistics() {
        TransactionStatisticsService statisticsService = mock(TransactionStatisticsService.class);
        TransactionStatisticsController controller = new TransactionStatisticsController(statisticsService, currentUserService());

        assertThatThrownBy(() -> controller.monthly(authentication(), OTHER_USER_ID, 2026, 11))
                .isInstanceOf(AccessDeniedException.class);
        verifyNoInteractions(statisticsService);
    }

    @Test
    void rejectsAnotherUsersTransactionFilter() {
        TransactionFilterService filterService = mock(TransactionFilterService.class);
        TransactionFilterController controller = new TransactionFilterController(filterService, currentUserService());
        TransactionFilter foreignFilter = TransactionFilter.builder()
                .filterId(10L)
                .user(User.builder().userId(OTHER_USER_ID).build())
                .build();
        when(filterService.getFilterById(10L)).thenReturn(foreignFilter);

        assertThatThrownBy(() -> controller.getFilterById(authentication(), 10L))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("다른 사용자의 거래 필터에 접근할 수 없습니다.");
    }

    @Test
    void checksAccountOwnershipBeforeReadingDashboardTransactions() {
        DashboardService dashboardService = mock(DashboardService.class);
        AccountService accountService = mock(AccountService.class);
        DashboardController controller = new DashboardController(dashboardService, accountService);
        doThrow(new AccessDeniedException("본인 계좌에만 접근할 수 있습니다."))
                .when(accountService).requireOwnedAccount("user@example.com", 99L);

        assertThatThrownBy(() -> controller.getRecentTransactions(authentication(), 99L, "desc", 10))
                .isInstanceOf(AccessDeniedException.class);
        verifyNoInteractions(dashboardService);
    }

    @Test
    void rejectsDeletingAnotherUsersNotification() {
        NotificationRepository notificationRepository = mock(NotificationRepository.class);
        NotificationServiceImpl service = new NotificationServiceImpl(
                notificationRepository, mock(UserRepository.class), mock(JavaMailSender.class));
        Notification foreignNotification = Notification.builder()
                .notificationId(20L)
                .user(User.builder().userId(OTHER_USER_ID).build())
                .build();
        when(notificationRepository.findById(20L)).thenReturn(Optional.of(foreignNotification));

        assertThatThrownBy(() -> service.deleteNotification(CURRENT_USER_ID, 20L))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("다른 사용자의 알림을 삭제할 수 없습니다.");
        verify(notificationRepository, never()).delete(any());
    }

    private CurrentUserService currentUserService() {
        UserFacade userFacade = mock(UserFacade.class);
        when(userFacade.getUserByEmail("user@example.com"))
                .thenReturn(UserInfo.builder().userId(CURRENT_USER_ID).email("user@example.com").build());
        return new CurrentUserService(userFacade);
    }

    private TestingAuthenticationToken authentication() {
        return new TestingAuthenticationToken("user@example.com", null, "ROLE_USER");
    }
}
