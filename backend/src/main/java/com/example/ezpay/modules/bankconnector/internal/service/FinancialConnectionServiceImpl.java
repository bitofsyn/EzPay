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
import java.math.BigDecimal;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.UUID;

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
        FinancialDataProvider provider = parseProvider(providerName);
        BankConnector connector = bankConnectorRegistry.get(provider);
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
        FinancialConnection connection = resolveSyncConnection(request.getUserId(), request.getConnectionId());
        return syncConnectionTransactions(connection, request.getUserId());
    }

    @Override
    @Transactional
    public TransactionSyncResult importSampleTransactions(SampleImportRequest request) {
        User user = getUser(request.getUserId());
        FinancialConnection connection = financialConnectionRepository
                .findByUserUserIdAndProvider(user.getUserId(), FinancialDataProvider.PLAID_SANDBOX)
                .stream()
                .findFirst()
                .orElseGet(() -> financialConnectionRepository.save(FinancialConnection.builder()
                        .user(user)
                        .provider(FinancialDataProvider.PLAID_SANDBOX)
                        .connectionReference("plaid-sample-" + user.getUserId())
                        .providerAccountReference("sample-account-" + user.getUserId())
                        .status("ACTIVE")
                        .accessToken("sample-import")
                        .build()));

        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        List<NormalizedTransactionRecord> records = List.of(
                sampleRecord(connection, now.minusDays(2), new BigDecimal("9800"), "스타벅스 성수점", "아메리카노 2잔", "FOOD_AND_DRINK", "CAFE"),
                sampleRecord(connection, now.minusDays(4), new BigDecimal("15800"), "배달의민족", "저녁 배달 주문", "FOOD_AND_DRINK", "DELIVERY"),
                sampleRecord(connection, now.minusDays(7), new BigDecimal("55200"), "이마트", "주간 장보기", "GENERAL_MERCHANDISE", "GROCERY"),
                sampleRecord(connection, now.minusDays(11), new BigDecimal("65000"), "SKT", "5월 통신요금", "BILLS_AND_UTILITIES", "MOBILE"),
                sampleRecord(connection, now.minusDays(14), new BigDecimal("7200"), "GS25", "편의점 간식", "GENERAL_MERCHANDISE", "CONVENIENCE_STORE"),
                sampleRecord(connection, now.minusDays(18), new BigDecimal("125000"), "오늘의집", "생활용품 결제", "GENERAL_MERCHANDISE", "HOME"),
                sampleRecord(connection, now.minusDays(24), new BigDecimal("32000"), "카카오T", "택시 이용", "TRANSPORTATION", "TAXI"),
                sampleRecord(connection, now.minusDays(29), new BigDecimal("43000"), "쿠팡", "생필품 정기 주문", "GENERAL_MERCHANDISE", "ONLINE_RETAIL")
        );

        TransactionSyncResult result = TransactionSyncResult.builder()
                .provider(FinancialDataProvider.PLAID_SANDBOX)
                .nextCursor("sample-import-" + UUID.randomUUID())
                .hasMore(false)
                .records(records)
                .build();

        saveNormalizedTransactions(connection, result);
        connection.setSyncCursor(result.getNextCursor());
        connection.setLastSyncedAt(Timestamp.from(Instant.now()));
        connection.setStatus("ACTIVE");
        connection.setLastErrorMessage(null);
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

    private void saveNormalizedTransactions(FinancialConnection connection, TransactionSyncResult result) {
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
    }

    private NormalizedTransactionRecord sampleRecord(
            FinancialConnection connection,
            OffsetDateTime postedAt,
            BigDecimal amount,
            String merchantName,
            String description,
            String primaryCategory,
            String detailedCategory
    ) {
        String providerTransactionId = "sample-" + merchantName + "-" + postedAt.toLocalDate();
        return NormalizedTransactionRecord.builder()
                .provider(FinancialDataProvider.PLAID_SANDBOX)
                .providerTransactionId(providerTransactionId)
                .providerAccountId(connection.getProviderAccountReference())
                .postedAt(postedAt)
                .authorizedAt(postedAt)
                .amount(amount)
                .currencyCode("KRW")
                .merchantName(merchantName)
                .description(description)
                .primaryCategory(primaryCategory)
                .detailedCategory(detailedCategory)
                .pending(false)
                .direction("OUTFLOW")
                .rawPayload(String.valueOf(Map.of(
                        "merchant_name", merchantName,
                        "description", description,
                        "currency", "KRW",
                        "sample", true
                )))
                .build();
    }

    private TransactionSyncResult syncConnectionTransactions(FinancialConnection connection, Long userId) {
        if (!connection.getUser().getUserId().equals(userId)) {
            throw new IllegalArgumentException("본인의 연결만 동기화할 수 있습니다.");
        }

        BankConnector connector = bankConnectorRegistry.get(connection.getProvider());
        try {
            TransactionSyncResult result = connector.syncTransactions(TransactionSyncRequest.builder()
                    .provider(connection.getProvider())
                    .userId(userId)
                    .connectionReference(connection.getConnectionReference())
                    .accessToken(connection.getAccessToken())
                    .fintechUseNum(connection.getFintechUseNum())
                    .cursor(connection.getSyncCursor())
                    .build());

            saveNormalizedTransactions(connection, result);

            connection.setSyncCursor(result.getNextCursor());
            connection.setLastSyncedAt(Timestamp.from(Instant.now()));
            connection.setStatus("ACTIVE");
            connection.setLastErrorMessage(null);
            financialConnectionRepository.save(connection);
            return result;
        } catch (RuntimeException e) {
            connection.setLastErrorMessage(e.getMessage());
            financialConnectionRepository.save(connection);
            throw e;
        }
    }

    private FinancialConnection resolveSyncConnection(Long userId, Long connectionId) {
        if (connectionId != null) {
            FinancialConnection connection = financialConnectionRepository.findById(connectionId)
                    .orElseThrow(() -> new CustomNotFoundException("연결 정보를 찾을 수 없습니다."));
            if (!connection.getUser().getUserId().equals(userId)) {
                throw new IllegalArgumentException("본인의 연결만 동기화할 수 있습니다.");
            }
            return connection;
        }

        return financialConnectionRepository
                .findByUserUserIdAndProvider(userId, FinancialDataProvider.PLAID_SANDBOX)
                .stream()
                .findFirst()
                .orElseThrow(() -> new CustomNotFoundException("금융 연결 정보를 찾을 수 없습니다."));
    }
}
