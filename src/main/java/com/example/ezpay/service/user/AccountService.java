package com.example.ezpay.service.user;

import com.example.ezpay.model.kafka.TransferEvent;
import com.example.ezpay.model.user.Accounts;
import com.example.ezpay.request.AccountRequest;

import java.math.BigDecimal;
import java.util.List;

public interface AccountService {
    Accounts createAccount(AccountRequest accountRequest);
    List<Accounts> getAllAccounts();
    // 특정 사용자의 모든 계좌 조회
    List<Accounts> getAccountByUserId(Long userId);
    Accounts updateBalance(Long accountId, BigDecimal balance);
    void deleteAccount(Long accountId);
}
