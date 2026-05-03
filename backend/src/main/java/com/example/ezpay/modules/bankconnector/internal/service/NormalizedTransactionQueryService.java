package com.example.ezpay.modules.bankconnector.internal.service;

import com.example.ezpay.modules.bankconnector.api.dto.NormalizedTransactionResponse;

import java.util.List;

public interface NormalizedTransactionQueryService {
    List<NormalizedTransactionResponse> getTransactions(Long userId, Long connectionId);

    List<NormalizedTransactionResponse> getRecentTransactions(Long userId, int limit);
}
