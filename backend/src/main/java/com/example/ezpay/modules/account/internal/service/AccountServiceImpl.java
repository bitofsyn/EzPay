package com.example.ezpay.modules.account.internal.service;

import com.example.ezpay.shared.exception.CustomNotFoundException;
import com.example.ezpay.model.user.Accounts;
import com.example.ezpay.model.user.User;
import com.example.ezpay.modules.account.api.dto.AccountCreateRequest;
import com.example.ezpay.repository.user.AccountRepository;
import com.example.ezpay.repository.user.UserRepository;
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
    public Accounts createAccount(String email, AccountCreateRequest accountRequest) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomNotFoundException("사용자를 찾을 수 없습니다."));

        String accountNumber = AccountNumberGenerator.generateAccountNumber(accountRequest.getBankName());
        Accounts account = accountRequest.toEntity(user, accountNumber);

        return accountRepository.save(account);
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

    @Override
    public void deleteAccount(String email, Long accountId) {
        Accounts account = requireOwnedAccount(email, accountId);
        accountRepository.delete(account);
    }

    @Override
    @Transactional(readOnly = true)
    public Accounts requireOwnedAccount(String email, Long accountId) {
        Accounts account = accountRepository.findById(accountId)
                .orElseThrow(() -> new CustomNotFoundException("계좌를 찾을 수 없습니다: " + accountId));
        if (!account.getUser().getEmail().equals(email)) {
            throw new org.springframework.security.access.AccessDeniedException("본인 계좌에만 접근할 수 있습니다.");
        }
        return account;
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
