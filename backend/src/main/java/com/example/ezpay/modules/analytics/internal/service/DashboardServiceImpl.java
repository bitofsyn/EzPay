package com.example.ezpay.modules.analytics.internal.service;

import com.example.ezpay.model.user.Accounts;
import com.example.ezpay.model.user.Transaction;
import com.example.ezpay.modules.account.internal.service.AccountService;
import com.example.ezpay.modules.payment.internal.service.TransactionService;
import com.example.ezpay.modules.user.api.dto.UserInfo;
import com.example.ezpay.modules.user.api.facade.UserFacade;
import com.example.ezpay.response.DashboardResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {
    private final UserFacade userFacade;
    private final AccountService accountService;
    private final TransactionService transactionService;

    @Override
    public DashboardResponse getDashboardInfo(Authentication authentication) {
        String email = authentication.getName();

        // 유저 정보 가져오기
        UserInfo user = userFacade.getUserByEmail(email);

        // 계좌 리스트 가져오기
        List<Accounts> accounts = accountService.getAccountByUserId(user.getUserId());

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
