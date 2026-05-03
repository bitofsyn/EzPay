package com.example.ezpay.modules.bankconnector.internal.service;

import com.example.ezpay.modules.bankconnector.api.dto.ConnectionExchangeResult;
import com.example.ezpay.modules.bankconnector.api.dto.ConnectionLinkToken;
import com.example.ezpay.modules.bankconnector.api.dto.SyncTransactionsRequest;
import com.example.ezpay.modules.bankconnector.api.dto.TransactionSyncResult;
import com.example.ezpay.model.user.FinancialConnection;

import java.util.List;

public interface FinancialConnectionService {
    ConnectionLinkToken createLinkToken(Long userId, String providerName);

    ConnectionExchangeResult exchangeConnection(Long userId, String providerName, String publicToken);

    TransactionSyncResult syncTransactions(SyncTransactionsRequest request);

    List<FinancialConnection> getConnections(Long userId);
}
