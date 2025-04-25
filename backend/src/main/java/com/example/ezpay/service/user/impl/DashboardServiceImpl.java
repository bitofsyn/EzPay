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

        // 유저 정보 가져오기
        UserResponse user = userService.getUserInfo(email);

        // 계좌 리스트 가져오기
        List<Accounts> accounts = accountService.getAccountByUserId(user.getId());

        // 거래 내역 대시보드 진입에서는 "최근 5개만 보여주도록"
        List<Transaction> transactions = Collections.emptyList();
        if(!accounts.isEmpty()) {
            // 대표 계좌 찾기 (isMain) 없으면 accounts.get(0)
            Accounts mainAccount = accounts.stream()
                    .filter(Accounts::isMain)
                    .findFirst()
                    .orElse(accounts.get(0));
            transactions = transactionService.getRecentTransactionByAccount(mainAccount.getAccountId(), "DESC", 5);
        }

        return DashboardResponse.builder()
                .user(user)
                .account(accounts)
                .transactions(transactions)
                .build();
    }

    @Override
    public List<Transaction> getRecentTransactions(Long accountId, String sort, int limit) {
        return transactionService.getRecentTransactionByAccount(accountId, sort, limit);
    }
}
