package com.example.ezpay.modules.account.api.dto;

import com.example.ezpay.model.user.Accounts;
import com.example.ezpay.model.user.User;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class AccountCreateRequest {
    @NotNull(message = "사용자 ID가 필요합니다.")
    private Long userId;

    @NotBlank(message = "은행명을 입력해주세요.")
    private String bankName;

    @NotNull(message = "초기 잔액을 입력해주세요.")
    @PositiveOrZero(message = "잔액은 0 이상이어야 합니다.")
    private BigDecimal balance;

    public Accounts toEntity(User user, String accountNumber) {
        return Accounts.builder()
                .user(user)
                .accountNumber(accountNumber)
                .bankName(bankName)
                .balance(balance)
                .build();
    }
}
