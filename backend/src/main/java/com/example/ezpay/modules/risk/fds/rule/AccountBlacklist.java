package com.example.ezpay.modules.risk.fds.rule;

/**
 * 블랙리스트 계좌 조회 추상화.
 * 현재는 인메모리 더미({@code InMemoryAccountBlacklist})이나,
 * 추후 외부 FDS/제재리스트 API 연동 구현으로 교체 가능하도록 인터페이스로 분리한다.
 */
public interface AccountBlacklist {
    boolean isBlacklisted(String accountNumber);
}
