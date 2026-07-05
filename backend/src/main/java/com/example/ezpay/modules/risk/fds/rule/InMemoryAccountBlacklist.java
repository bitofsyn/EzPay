package com.example.ezpay.modules.risk.fds.rule;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 인메모리 블랙리스트 더미 구현.
 * {@code ezpay.fds.blacklist.accounts} 프로퍼티(쉼표 구분 계좌번호)로 주입되며,
 * 값이 없으면 빈 집합으로 동작한다. 운영 시 외부 제재리스트 연동 구현으로 대체한다.
 */
@Component
public class InMemoryAccountBlacklist implements AccountBlacklist {

    private final Set<String> blacklisted;

    public InMemoryAccountBlacklist(
            @Value("${ezpay.fds.blacklist.accounts:}") String accounts) {
        this.blacklisted = (accounts == null || accounts.isBlank())
                ? Set.of()
                : Arrays.stream(accounts.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toUnmodifiableSet());
    }

    @Override
    public boolean isBlacklisted(String accountNumber) {
        return accountNumber != null && blacklisted.contains(accountNumber);
    }
}
