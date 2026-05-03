package com.example.ezpay.modules.bankconnector.api.dto;

import com.example.ezpay.shared.common.enums.FinancialDataProvider;
import lombok.Builder;
import lombok.Singular;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class TransactionSyncResult {
    FinancialDataProvider provider;
    String nextCursor;
    boolean hasMore;
    @Singular
    List<NormalizedTransactionRecord> records;
}
