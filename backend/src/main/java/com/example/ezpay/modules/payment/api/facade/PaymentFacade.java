package com.example.ezpay.modules.payment.api.facade;

import com.example.ezpay.modules.payment.api.dto.TransactionInfo;
import com.example.ezpay.modules.payment.api.dto.TransferCommand;
import com.example.ezpay.modules.payment.api.dto.TransferLimitInfo;

import java.math.BigDecimal;
import java.util.List;

/**
    Payment 모듈의 공개 API Facade
    송금, 거래, 송금한도 관리
 */
public interface PaymentFacade {

    // 송금 요청 (비동기 처리 - Kafka)
    void initiateTransfer(TransferCommand command);

    // 거래 ID로 거래 정보 조회
    TransactionInfo getTransaction(Long transactionId);

    // 계좌별 거래 내역 조회
    List<TransactionInfo> getTransactionsByAccount(Long accountId);

    // 보낸 거래 내역 조회
    List<TransactionInfo> getSentTransactions(Long senderAccountId);

    // 받은 거래 내역 조회
    List<TransactionInfo> getReceivedTransactions(Long receiverAccountId);

    // 최근 거래 내역 조회 (정렬 및 제한)
    List<TransactionInfo> getRecentTransactions(Long accountId, String sort, int limit);

    // 사용자의 송금 한도 조회
    TransferLimitInfo getTransferLimit(Long userId);

    // 송금 가능 여부 확인 (한도 검증)
    boolean canTransfer(Long userId, BigDecimal amount);

    // 남은 일일 송금 한도 조회
    BigDecimal getRemainingDailyLimit(Long userId);

    // 신규 사용자 기본 송금 한도 초기화
    void initializeTransferLimit(Long userId, BigDecimal dailyLimit, BigDecimal perTransactionLimit);
}
