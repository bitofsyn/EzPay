package com.example.ezpay.model.user;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AccountsTest {

    @Test
    void withdrawAndDepositChangeBalanceThroughDomainMethods() {
        Accounts account = Accounts.builder().balance(new BigDecimal("1000")).build();

        account.withdraw(new BigDecimal("400"));
        account.deposit(new BigDecimal("150"));

        assertThat(account.getBalance()).isEqualByComparingTo("750");
    }

    @Test
    void withdrawRejectsAmountGreaterThanBalance() {
        Accounts account = Accounts.builder().balance(new BigDecimal("1000")).build();

        assertThatThrownBy(() -> account.withdraw(new BigDecimal("1001")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("잔액 부족으로 송금할 수 없습니다.");
        assertThat(account.getBalance()).isEqualByComparingTo("1000");
    }
}
