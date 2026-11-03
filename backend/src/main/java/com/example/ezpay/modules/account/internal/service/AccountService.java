package com.example.ezpay.modules.account.internal.service;

import com.example.ezpay.model.user.Accounts;
import com.example.ezpay.modules.account.api.dto.AccountCreateRequest;
import org.springframework.security.core.Authentication;

import java.util.List;

/**
 * Account 모듈 내부 서비스 - 계좌 관리
 */
public interface AccountService {
    // 계좌 생성
    Accounts createAccount(String email, AccountCreateRequest accountRequest);

    // 인증된 사용자의 모든 계좌 조회
    List<Accounts> getMyAccounts(Authentication authentication);

    // 사용자 ID로 계좌 조회
    List<Accounts> getAccountByUserId(Long userId);

    // 계좌 ID로 계좌 조회
    Accounts getAccountById(Long accountId);

    // 계좌번호로 계좌 조회
    Accounts getAccountByNumber(String accountNumber);

    // 사용자의 메인 계좌 조회
    Accounts getMainAccountByUserId(Long userId);

    // 계좌 삭제
    void deleteAccount(String email, Long accountId);

    // 계좌가 인증된 사용자의 소유인지 검증
    Accounts requireOwnedAccount(String email, Long accountId);

    // 대표 계좌 설정
    void setMainAccount(String email, Long accountId);

    // 계좌번호 존재 여부 확인
    boolean existsByAccountNumber(String accountNumber);
}
