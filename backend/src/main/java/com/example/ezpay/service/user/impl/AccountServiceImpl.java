package com.example.ezpay.service.user.impl;

import com.example.ezpay.exception.CustomNotFoundException;
import com.example.ezpay.model.user.Accounts;
import com.example.ezpay.model.user.User;
import com.example.ezpay.repository.user.AccountRepository;
import com.example.ezpay.repository.user.UserRepository;
import com.example.ezpay.request.AccountRequest;
import com.example.ezpay.service.AccountNumberGenerator;
import com.example.ezpay.service.user.AccountService;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class AccountServiceImpl implements AccountService {
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    public AccountServiceImpl(AccountRepository accountRepository, UserRepository userRepository) {
        this.accountRepository = accountRepository;
        this.userRepository = userRepository;
    }

    // 계좌 생성
    @Override
    public Accounts createAccount(AccountRequest accountRequest) {
        // 사용자 존재 여부 확인
        User user = userRepository.findById(accountRequest.getUserId())
                .orElseThrow(() -> new CustomNotFoundException("사용자를 찾을 수 없습니다." + accountRequest.getUserId()));

        /*
            특정 은행이면 앞자리 두자리 고정 뒤에는 랜덤 계좌 번호 생성
         */
        String accountNumber = AccountNumberGenerator.generateAccountNumber(accountRequest.getBankName());
        Accounts account = accountRequest.toEntity(user, accountNumber);

        return accountRepository.save(account);
    }

    @Override
    public List<Accounts> getAllAccounts() {
        return List.of();
    }


    @Override
    public List<Accounts> getMyAccounts(Authentication authentication) {
        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomNotFoundException("사용자를 찾을 수 없습니다."));

        Long userId = user.getUserId();
        return accountRepository.findByUserUserId(userId);
    }

    @Override
    public List<Accounts> getAccountByUserId(Long userId) {
        return accountRepository.findByUserUserId(userId);
    }

    // 계좌 잔액 수정(입출금)
    @Transactional
    @Override
    public Accounts updateBalance(Long accountId, BigDecimal balance) {
        Accounts account = accountRepository.findById(accountId)
                .orElseThrow(() -> new CustomNotFoundException("계좌를 찾을 수 없습니다." + accountId));

        BigDecimal newBalance = account.getBalance().add(balance);

        if(newBalance.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("잔액이 부족합니다.");
        }

        account.setBalance(newBalance);
        return accountRepository.save(account);
    }

    // 계좌 삭제
    @Override
    public void deleteAccount(Long accountId) {
        Accounts account = accountRepository.findById(accountId)
                .orElseThrow(() -> new CustomNotFoundException("계좌를 찾을 수 없습니다." + accountId));
        accountRepository.delete(account);
    }
}
