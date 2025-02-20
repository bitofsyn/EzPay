package com.example.ezpay.service.user;

import com.example.ezpay.model.user.TransactionFilter;
import com.example.ezpay.request.TransactionFilterRequest;
import com.example.ezpay.response.TransactionFilterResponse;

import java.util.List;

public interface TransactionFilterService {
    TransactionFilter saveFilter(TransactionFilterRequest transactionFilterRequest);
    List<TransactionFilter> readFilterByUser(Long userId);
    // 특정 필터 조회
    TransactionFilter getFilterById(Long id);

    // 필터 조건 검색(날짜 범위, 금액 범위로 검색)
    List<TransactionFilter> searchFilter(TransactionFilterRequest transactionFilterRequest);
    TransactionFilterResponse updateFilter(Long id, TransactionFilterRequest transactionFilterRequest);
    void deleteFilter(Long id);
}
