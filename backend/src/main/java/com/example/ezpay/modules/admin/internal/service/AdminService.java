package com.example.ezpay.modules.admin.internal.service;

import com.example.ezpay.modules.admin.api.dto.AdminDashboardInfo;
import com.example.ezpay.modules.user.api.dto.UserInfo;
import com.example.ezpay.modules.payment.api.dto.TransactionInfo;
import com.example.ezpay.modules.payment.api.dto.TransferLimitInfo;
import com.example.ezpay.modules.account.api.dto.AccountInfo;
import com.example.ezpay.request.TransferLimitRequest;
import com.example.ezpay.shared.common.enums.Status;
import java.util.List;

/**
 * Admin 모듈 내부 서비스 인터페이스
 * 관리자 기능 (사용자, 거래, 송금 한도 관리)
 */
public interface AdminService {

    // ========== 대시보드 ==========
    // Admin 대시보드 통계 조회
    AdminDashboardInfo getDashboardStats();

    // ========== 사용자 관리 ==========
    // 모든 사용자 조회
    List<UserInfo> getAllUsers();

    // 특정 사용자 상세 조회
    UserInfo getUserById(Long userId);

    // 사용자 상태 변경
    void updateUserStatus(Long userId, Status status);

    // 사용자 삭제
    void deleteUser(Long userId);

    // 특정 사용자의 계좌 조회
    List<AccountInfo> getUserAccounts(Long userId);

    // ========== 거래 관리 ==========
    // 모든 거래 조회
    List<TransactionInfo> getAllTransactions();

    // 특정 사용자의 거래 조회
    List<TransactionInfo> getUserTransactions(Long userId);

    // 거래 삭제
    void deleteTransaction(Long transactionId);

    // ========== 송금 한도 관리 ==========
    // 모든 송금 한도 조회
    List<TransferLimitInfo> getAllTransferLimits();

    // 사용자 송금 한도 수정
    void updateUserTransferLimit(Long userId, TransferLimitRequest request);

    // 사용자 송금 한도 초기화
    void resetUserTransferLimit(Long userId);

    // ========== 에러 로그 관리 ==========
    // 모든 에러 로그 조회
    List<com.example.ezpay.modules.admin.api.dto.ErrorLogInfo> getAllErrorLogs();

    // 특정 상태의 에러 로그 조회
    List<com.example.ezpay.modules.admin.api.dto.ErrorLogInfo> getErrorLogsByStatus(com.example.ezpay.shared.common.enums.ErrorLogStatus status);

    // 에러 로그 해결 처리
    void resolveErrorLog(Long logId);

    // 에러 로그 삭제
    void deleteErrorLog(Long logId);
}
