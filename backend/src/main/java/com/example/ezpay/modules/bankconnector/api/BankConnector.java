package com.example.ezpay.modules.bankconnector.api;

import com.example.ezpay.modules.bankconnector.api.dto.ConnectionExchangeCommand;
import com.example.ezpay.modules.bankconnector.api.dto.ConnectionExchangeResult;
import com.example.ezpay.modules.bankconnector.api.dto.ConnectionLinkToken;
import com.example.ezpay.modules.bankconnector.api.dto.TransactionSyncRequest;
import com.example.ezpay.modules.bankconnector.api.dto.TransactionSyncResult;
import com.example.ezpay.shared.common.enums.FinancialDataProvider;

public interface BankConnector {
    FinancialDataProvider provider();

    ConnectionLinkToken createLinkToken(Long userId);

    ConnectionExchangeResult exchangeConnection(ConnectionExchangeCommand command);

    TransactionSyncResult syncTransactions(TransactionSyncRequest request);
}
