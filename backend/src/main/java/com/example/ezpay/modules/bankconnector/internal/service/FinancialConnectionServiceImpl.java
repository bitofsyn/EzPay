package com.example.ezpay.modules.bankconnector.internal.service;

import com.example.ezpay.modules.bankconnector.api.BankConnector;
import com.example.ezpay.modules.bankconnector.api.dto.*;
import com.example.ezpay.model.user.FinancialConnection;
import com.example.ezpay.model.user.NormalizedTransaction;
import com.example.ezpay.model.user.User;
import com.example.ezpay.repository.user.FinancialConnectionRepository;
import com.example.ezpay.repository.user.NormalizedTransactionRepository;
import com.example.ezpay.repository.user.UserRepository;
import com.example.ezpay.shared.common.enums.FinancialDataProvider;
import com.example.ezpay.shared.exception.CustomNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FinancialConnectionServiceImpl implements FinancialConnectionService {
    private final UserRepository userRepository;
    private final FinancialConnectionRepository financialConnectionRepository;
    private final NormalizedTransactionRepository normalizedTransactionRepository;
    private final BankConnectorRegistry bankConnectorRegistry;

    @Override
    public ConnectionLinkToken createLinkToken(Long userId, String providerName) {
        User user = getUser(userId);
        BankConnector connector = getConnector(providerName);
        return connector.createLinkToken(user.getUserId());
    }

    @Override
    @Transactional
    public ConnectionExchangeResult exchangeConnection(Long userId, String providerName, String publicToken) {
        User user = getUser(userId);
        FinancialDataProvider provider = parseProvider(providerName);
        BankConnector connector = bankConnectorRegistry.get(provider);

        ConnectionExchangeResult result = connector.exchangeConnection(ConnectionExchangeCommand.builder()
                .provider(provider)
                .userId(user.getUserId())
                .publicToken(publicToken)
                .build());

        FinancialConnection connection = FinancialConnection.builder()
                .user(user)
                .provider(provider)
                .connectionReference(result.getConnectionReference())
                .providerAccountReference(result.getProviderAccountReference())
                .accessToken(result.getAccessToken())
                .status("ACTIVE")
                .build();
        financialConnectionRepository.save(connection);
        return result;
    }

    @Override
    @Transactional
    public TransactionSyncResult syncTransactions(SyncTransactionsRequest request) {
        FinancialConnection connection = financialConnectionRepository.findById(request.getConnectionId())
                .orElseThrow(() -> new CustomNotFoundException("연결 정보를 찾을 수 없습니다."));

        if (!connection.getUser().getUserId().equals(request.getUserId())) {
            throw new IllegalArgumentException("본인의 연결만 동기화할 수 있습니다.");
        }

        BankConnector connector = bankConnectorRegistry.get(connection.getProvider());
        TransactionSyncResult result = connector.syncTransactions(TransactionSyncRequest.builder()
                .provider(connection.getProvider())
                .userId(request.getUserId())
                .connectionReference(connection.getConnectionReference())
                .accessToken(connection.getAccessToken())
                .cursor(connection.getSyncCursor())
                .build());

        for (NormalizedTransactionRecord record : result.getRecords()) {
            NormalizedTransaction transaction = normalizedTransactionRepository
                    .findByProviderAndProviderTransactionId(record.getProvider(), record.getProviderTransactionId())
                    .orElseGet(() -> NormalizedTransaction.builder()
                            .user(connection.getUser())
                            .connection(connection)
                            .provider(record.getProvider())
                            .providerTransactionId(record.getProviderTransactionId())
                            .build());

            transaction.setUser(connection.getUser());
            transaction.setConnection(connection);
            transaction.setProvider(record.getProvider());
            transaction.setProviderTransactionId(record.getProviderTransactionId());
            transaction.setProviderAccountId(record.getProviderAccountId());
            transaction.setPostedAt(record.getPostedAt());
            transaction.setAuthorizedAt(record.getAuthorizedAt());
            transaction.setAmount(record.getAmount());
            transaction.setCurrencyCode(record.getCurrencyCode());
            transaction.setDirection(record.getDirection());
            transaction.setMerchantName(record.getMerchantName());
            transaction.setDescription(record.getDescription());
            transaction.setPrimaryCategory(record.getPrimaryCategory());
            transaction.setDetailedCategory(record.getDetailedCategory());
            transaction.setPending(record.isPending());
            transaction.setRawPayload(record.getRawPayload());
            normalizedTransactionRepository.save(transaction);
        }

        connection.setSyncCursor(result.getNextCursor());
        connection.setLastSyncedAt(Timestamp.from(Instant.now()));
        connection.setStatus("ACTIVE");
        financialConnectionRepository.save(connection);

        return result;
    }

    @Override
    public List<FinancialConnection> getConnections(Long userId) {
        return financialConnectionRepository.findByUserUserId(userId);
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new CustomNotFoundException("사용자를 찾을 수 없습니다."));
    }

    private BankConnector getConnector(String providerName) {
        return bankConnectorRegistry.get(parseProvider(providerName));
    }

    private FinancialDataProvider parseProvider(String providerName) {
        try {
            return FinancialDataProvider.valueOf(providerName);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("지원하지 않는 금융 데이터 제공자입니다: " + providerName);
        }
    }
}
