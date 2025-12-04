package com.example.ezpay.modules.account.api.facade;

import com.example.ezpay.modules.account.api.dto.AccountInfo;

import java.math.BigDecimal;
import java.util.List;

/**
 * Account 모듈의 공개 API Facade
 * 다른 모듈에서 계좌 정보에 접근할 때 이 인터페이스를 통해서만 접근
 */
public interface AccountFacade {

    /**
     * 계좌 ID로 계좌 정보 조회
     */
    AccountInfo getAccountById(Long accountId);

    /**
     * 계좌번호로 계좌 정보 조회
     */
    AccountInfo getAccountByNumber(String accountNumber);

    /**
     * 사용자 ID로 모든 계좌 조회
     */
    List<AccountInfo> getAccountsByUserId(Long userId);

    /**
     * 사용자의 메인 계좌 조회
     */
    AccountInfo getMainAccountByUserId(Long userId);

    /**
     * 계좌 잔액 조회
     */
    BigDecimal getBalance(Long accountId);

    /**
     * 계좌 존재 여부 확인
     */
    boolean existsByAccountNumber(String accountNumber);

    /**
     * 계좌 소유자 이름 조회
     */
    String getOwnerName(String accountNumber);
}
