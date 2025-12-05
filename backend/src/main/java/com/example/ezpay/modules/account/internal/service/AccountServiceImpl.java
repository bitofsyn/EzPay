package com.example.ezpay.modules.account.internal.service;

import com.example.ezpay.shared.exception.CustomNotFoundException;
import com.example.ezpay.model.user.Accounts;
import com.example.ezpay.model.user.User;
import com.example.ezpay.repository.user.AccountRepository;
import com.example.ezpay.repository.user.UserRepository;
import com.example.ezpay.request.AccountRequest;
import com.example.ezpay.shared.util.AccountNumberGenerator;
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

    @Override
    public Accounts createAccount(AccountRequest accountRequest) {
        User user = userRepository.findById(accountRequest.getUserId())
                .orElseThrow(() -> new CustomNotFoundException("사용자를 찾을 수 없습니다." + accountRequest.getUserId()));

        String accountNumber = AccountNumberGenerator.generateAccountNumber(accountRequest.getBankName());
        Accounts account = accountRequest.toEntity(user, accountNumber);

        return accountRepository.save(account);
    }

    @Override
    public List<Accounts> getAllAccounts() {
        return accountRepository.findAll();
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

    @Override
    public Accounts getAccountById(Long accountId) {
        return accountRepository.findById(accountId)
                .orElseThrow(() -> new CustomNotFoundException("계좌를 찾을 수 없습니다: " + accountId));
    }

    @Override
    public Accounts getAccountByNumber(String accountNumber) {
        return accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new CustomNotFoundException("계좌를 찾을 수 없습니다: " + accountNumber));
    }

    @Override
    public Accounts getMainAccountByUserId(Long userId) {
        List<Accounts> accounts = accountRepository.findByUserUserId(userId);

        return accounts.stream()
                .filter(Accounts::isMain)
                .findFirst()
                .orElse(accounts.isEmpty() ? null : accounts.get(0));
    }

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

    @Override
    public void deleteAccount(Long accountId) {
        Accounts account = accountRepository.findById(accountId)
                .orElseThrow(() -> new CustomNotFoundException("계좌를 찾을 수 없습니다." + accountId));
        accountRepository.delete(account);
    }

    @Transactional
    @Override
    public void setMainAccount(String email, Long accountId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("사용자 정보를 찾을 수 없습니다."));

        List<Accounts> accounts = accountRepository.findByUser(user);

        // 모든 계좌 isMain false로 초기화
        for(Accounts account : accounts) {
            account.setMain(false);
        }

        // 선택한 계좌만 isMain true
        Accounts mainAccount = accounts.stream()
                .filter(x -> x.getAccountId().equals(accountId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("선택한 계좌를 찾을 수 없습니다."));

        mainAccount.setMain(true);
        accountRepository.saveAll(accounts);
    }

    @Override
    public boolean existsByAccountNumber(String accountNumber) {
        return accountRepository.findByAccountNumber(accountNumber).isPresent();
    }
}
