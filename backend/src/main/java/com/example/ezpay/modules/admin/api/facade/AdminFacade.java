package com.example.ezpay.modules.admin.api.facade;

import com.example.ezpay.modules.user.api.dto.UserInfo;
import com.example.ezpay.modules.payment.api.dto.TransactionInfo;

import java.util.List;

// 관리자 기능 (읽기 전용으로 다른 모듈 데이터 조회)
public interface AdminFacade {

    // 모든 사용자 조회
    List<UserInfo> getAllUsers();

    // 모든 거래 조회
    List<TransactionInfo> getAllTransactions();

    // 특정 사용자의 거래 조회
    List<TransactionInfo> getUserTransactions(Long userId);
}
