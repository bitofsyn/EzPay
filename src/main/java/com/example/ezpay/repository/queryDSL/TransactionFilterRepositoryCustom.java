package com.example.ezpay.repository.queryDSL;

import com.example.ezpay.model.user.TransactionFilter;
import com.example.ezpay.request.TransactionFilterRequest;

import java.util.List;

public interface TransactionFilterRepositoryCustom {
    List<TransactionFilter> searchFilters(TransactionFilterRequest transactionFilterRequest);
}
