package com.example.ezpay.modules.payment.internal.service;

import com.example.ezpay.model.user.TransactionFilter;
import com.example.ezpay.request.TransactionFilterRequest;
import com.example.ezpay.response.TransactionFilterResponse;

import java.util.List;

/**
 * Payment 모듈 내부 서비스 - 거래 필터 관리
 */
public interface TransactionFilterService {
    TransactionFilter saveFilter(TransactionFilterRequest transactionFilterRequest);
    List<TransactionFilter> readFilterByUser(Long userId);
    TransactionFilter getFilterById(Long id);
    List<TransactionFilter> searchFilter(TransactionFilterRequest transactionFilterRequest);
    TransactionFilterResponse updateFilter(Long id, TransactionFilterRequest transactionFilterRequest);
    void deleteFilter(Long id);
}
