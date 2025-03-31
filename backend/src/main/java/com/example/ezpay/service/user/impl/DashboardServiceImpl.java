package com.example.ezpay.service.user.impl;

import com.example.ezpay.model.user.Accounts;
import com.example.ezpay.model.user.Transaction;
import com.example.ezpay.response.DashboardResponse;
import com.example.ezpay.response.UserResponse;
import com.example.ezpay.service.user.AccountService;
import com.example.ezpay.service.user.DashboardService;
import com.example.ezpay.service.user.TransactionService;
import com.example.ezpay.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {
    private final UserService userService;
    private final AccountService accountService;
    private final TransactionService transactionService;

    @Override
    public DashboardResponse getDashboardInfo(Authentication authentication) {
        String email = authentication.getName();
        UserResponse user = userService.getUserInfo(email);
        System.out.println("user = " + user);
        List<Accounts> accounts = accountService.getAccountByUserId(user.getId());
        System.out.println("accounts = " + accounts);

        Accounts mainAccount = accounts.isEmpty() ? null : accounts.get(0);
        BigDecimal balance = mainAccount != null ? mainAccount.getBalance() : BigDecimal.ZERO;

        List<Transaction> transactions = mainAccount != null ?
                transactionService.getTransactionByAccount(mainAccount.getAccountId()) :
                Collections.emptyList();

        return DashboardResponse.builder()
                .user(user)
                .account(mainAccount)
                .balance(balance)
                .transactions(transactions)
                .build();
    }
}
