package com.example.ezpay.modules.account.internal.facade;

import com.example.ezpay.model.user.Accounts;
import com.example.ezpay.modules.account.api.dto.AccountInfo;
import com.example.ezpay.modules.account.api.facade.AccountFacade;
import com.example.ezpay.modules.account.internal.service.AccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.ZoneId;
import java.util.List;
import java.util.stream.Collectors;

/**
 * AccountFacade 구현체
 * 다른 모듈에서 Account 기능을 사용할 때 이 Facade를 통해 접근
 */
@Component
@RequiredArgsConstructor
public class AccountFacadeImpl implements AccountFacade {

    private final AccountService accountService;

    @Override
    public AccountInfo getAccountById(Long accountId) {
        Accounts account = accountService.getAccountById(accountId);
        return convertToAccountInfo(account);
    }

    @Override
    public AccountInfo getAccountByNumber(String accountNumber) {
        Accounts account = accountService.getAccountByNumber(accountNumber);
        return convertToAccountInfo(account);
    }

    @Override
    public List<AccountInfo> getAccountsByUserId(Long userId) {
        List<Accounts> accounts = accountService.getAccountByUserId(userId);
        return accounts.stream()
                .map(this::convertToAccountInfo)
                .collect(Collectors.toList());
    }

    @Override
    public AccountInfo getMainAccountByUserId(Long userId) {
        Accounts mainAccount = accountService.getMainAccountByUserId(userId);
        return mainAccount != null ? convertToAccountInfo(mainAccount) : null;
    }

    @Override
    public BigDecimal getBalance(Long accountId) {
        Accounts account = accountService.getAccountById(accountId);
        return account.getBalance();
    }

    @Override
    public boolean existsByAccountNumber(String accountNumber) {
        return accountService.existsByAccountNumber(accountNumber);
    }

    @Override
    public String getOwnerName(String accountNumber) {
        Accounts account = accountService.getAccountByNumber(accountNumber);
        return account.getUser().getName();
    }

    // Accounts -> AccountInfo 변환 헬퍼 메서드
    private AccountInfo convertToAccountInfo(Accounts account) {
        return AccountInfo.builder()
                .accountId(account.getAccountId())
                .userId(account.getUser().getUserId())
                .accountNumber(account.getAccountNumber())
                .bankName(account.getBankName())
                .balance(account.getBalance())
                .isMainAccount(account.isMain())
                .createdAt(account.getCreatedAt().toInstant()
                        .atZone(ZoneId.systemDefault())
                        .toLocalDateTime())
                .build();
    }
}
