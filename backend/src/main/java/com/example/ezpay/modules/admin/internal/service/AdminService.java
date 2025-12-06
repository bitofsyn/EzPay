package com.example.ezpay.modules.admin.internal.service;

import com.example.ezpay.modules.user.api.dto.UserInfo;
import com.example.ezpay.modules.payment.api.dto.TransactionInfo;
import com.example.ezpay.modules.payment.api.dto.TransferLimitInfo;
import com.example.ezpay.request.TransferLimitRequest;

import java.util.List;

/**
 * Admin 모듈 내부 서비스 인터페이스
 * 관리자 기능 (사용자, 거래, 송금 한도 관리)
 */
public interface AdminService {

    /**
     * 모든 사용자 조회
     */
    List<UserInfo> getAllUsers();

    /**
     * 모든 거래 조회
     */
    List<TransactionInfo> getAllTransactions();

    /**
     * 특정 사용자의 거래 조회
     */
    List<TransactionInfo> getUserTransactions(Long userId);

    /**
     * 거래 삭제
     */
    void deleteTransaction(Long transactionId);

    /**
     * 모든 송금 한도 조회
     */
    List<TransferLimitInfo> getAllTransferLimits();

    /**
     * 사용자 송금 한도 수정
     */
    void updateUserTransferLimit(Long userId, TransferLimitRequest request);

    /**
     * 사용자 송금 한도 초기화
     */
    void resetUserTransferLimit(Long userId);
}
