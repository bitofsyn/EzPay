package com.example.ezpay.modules.payment.internal.service;

import com.example.ezpay.model.user.Accounts;
import com.example.ezpay.model.user.TransferLimit;
import com.example.ezpay.model.user.User;
import com.example.ezpay.repository.user.TransactionRepository;
import com.example.ezpay.repository.user.TransferLimitRepository;
import com.example.ezpay.repository.user.UserRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class TransferLimitServiceTest {

    @Test
    void allowsAmountWithinPerTransactionAndRemainingDailyLimits() {
        Fixture fixture = fixture("1000000", "300000", "600000");

        assertThat(fixture.service.canTransfer(1L, new BigDecimal("300000"))).isTrue();
    }

    @Test
    void rejectsAmountAbovePerTransactionLimit() {
        Fixture fixture = fixture("1000000", "300000", "0");

        assertThat(fixture.service.canTransfer(1L, new BigDecimal("300001"))).isFalse();
    }

    @Test
    void rejectsAmountAboveRemainingDailyLimit() {
        Fixture fixture = fixture("1000000", "800000", "900000");

        assertThat(fixture.service.canTransfer(1L, new BigDecimal("100001"))).isFalse();
    }

    @Test
    void rejectsNullZeroAndNegativeAmounts() {
        Fixture fixture = fixture("1000000", "300000", "0");

        assertThat(fixture.service.canTransfer(1L, null)).isFalse();
        assertThat(fixture.service.canTransfer(1L, BigDecimal.ZERO)).isFalse();
        assertThat(fixture.service.canTransfer(1L, BigDecimal.ONE.negate())).isFalse();
    }

    private Fixture fixture(String dailyLimit, String perTransactionLimit, String usedToday) {
        TransferLimitRepository limitRepository = mock(TransferLimitRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        TransactionRepository transactionRepository = mock(TransactionRepository.class);
        TransferLimitServiceImpl service = new TransferLimitServiceImpl(
                limitRepository, userRepository, transactionRepository);

        Accounts account = Accounts.builder().accountId(10L).balance(BigDecimal.ZERO).build();
        User user = User.builder().userId(1L).accounts(List.of(account)).build();
        TransferLimit limit = TransferLimit.builder()
                .userId(1L)
                .user(user)
                .dailyLimit(new BigDecimal(dailyLimit))
                .perTransactionLimit(new BigDecimal(perTransactionLimit))
                .build();

        when(limitRepository.findByUserId(1L)).thenReturn(Optional.of(limit));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(transactionRepository.sumTodayTransactionBySender(any(), any(LocalDate.class)))
                .thenReturn(new BigDecimal(usedToday));
        return new Fixture(service);
    }

    private record Fixture(TransferLimitServiceImpl service) {}
}
