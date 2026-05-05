package com.example.ezpay.modules.bankconnector.internal.service;

import com.example.ezpay.modules.bankconnector.api.dto.ConnectionExchangeResult;
import com.example.ezpay.modules.bankconnector.api.dto.ConnectionLinkToken;
import com.example.ezpay.modules.bankconnector.api.dto.KftcAccountInfoResponse;
import com.example.ezpay.modules.bankconnector.api.dto.KftcAccountInfoRequest;
import com.example.ezpay.modules.bankconnector.api.dto.KftcAccountRegistrationCallbackRequest;
import com.example.ezpay.modules.bankconnector.api.dto.KftcAccountRegistrationCallbackResult;
import com.example.ezpay.modules.bankconnector.api.dto.KftcRegisteredAccountRequest;
import com.example.ezpay.modules.bankconnector.api.dto.KftcRegisteredAccountResponse;
import com.example.ezpay.modules.bankconnector.api.dto.KftcRegisteredAccountSelectionRequest;
import com.example.ezpay.modules.bankconnector.api.dto.KftcSelectedAccountRequest;
import com.example.ezpay.modules.bankconnector.api.dto.KftcSelectedAccountResult;
import com.example.ezpay.modules.bankconnector.api.dto.KftcTokenExchangeCallbackRequest;
import com.example.ezpay.modules.bankconnector.api.dto.KftcTokenExchangeCallbackResult;
import com.example.ezpay.modules.bankconnector.api.dto.KftcAuthorizationCallbackResult;
import com.example.ezpay.modules.bankconnector.api.dto.SampleImportRequest;
import com.example.ezpay.modules.bankconnector.api.dto.SyncTransactionsRequest;
import com.example.ezpay.modules.bankconnector.api.dto.TransactionSyncResult;
import com.example.ezpay.model.user.FinancialConnection;

import java.util.List;

public interface FinancialConnectionService {
    ConnectionLinkToken createLinkToken(Long userId, String providerName);

    ConnectionExchangeResult exchangeConnection(Long userId, String providerName, String publicToken);

    TransactionSyncResult syncTransactions(SyncTransactionsRequest request);

    KftcAuthorizationCallbackResult handleKftcAuthorizationCallback(Long userId, String authorizationCode, String state);

    KftcTokenExchangeCallbackResult handleKftcTokenExchangeCallback(KftcTokenExchangeCallbackRequest request);

    KftcTokenExchangeCallbackResult saveKftcFintechUseNum(Long userId, String fintechUseNum);

    KftcAccountInfoResponse listKftcAccounts(KftcAccountInfoRequest request);

    KftcRegisteredAccountResponse listKftcRegisteredAccounts(KftcRegisteredAccountRequest request);

    KftcAccountRegistrationCallbackResult handleKftcAccountRegistrationCallback(KftcAccountRegistrationCallbackRequest request);

    KftcSelectedAccountResult saveKftcSelectedAccount(KftcSelectedAccountRequest request);

    KftcSelectedAccountResult saveKftcRegisteredAccountSelection(KftcRegisteredAccountSelectionRequest request);

    TransactionSyncResult importSampleTransactions(SampleImportRequest request);

    List<FinancialConnection> getConnections(Long userId);
}
