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
        if (provider == FinancialDataProvider.KFTC_OPEN_BANKING) {
            ensureKftcConnection(user);
        }
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
    public KftcAuthorizationCallbackResult handleKftcAuthorizationCallback(Long userId, String authorizationCode, String state) {
        User user = getUser(userId);
        FinancialConnection connection = ensureKftcConnection(user);

        connection.setAuthorizationCode(authorizationCode);
        connection.setAuthorizationState(state);
        connection.setAuthorizationReceivedAt(Timestamp.from(Instant.now()));
        connection.setStatus("AUTH_CODE_RECEIVED");
        connection.setLastErrorMessage(null);
        financialConnectionRepository.save(connection);

        TokenExchangeAttempt tokenExchangeAttempt = attemptKftcTokenExchange(connection);

        return KftcAuthorizationCallbackResult.builder()
                .userId(user.getUserId())
                .connectionId(connection.getConnectionId())
                .status(connection.getStatus())
                .message(tokenExchangeAttempt.message())
                .authorizationState(state)
                .build();
    }

    @Override
    @Transactional
    public KftcTokenExchangeCallbackResult handleKftcTokenExchangeCallback(KftcTokenExchangeCallbackRequest request) {
        User user = getUser(request.getUserId());
        FinancialConnection connection = ensureKftcConnection(user);

        if (request.getAuthorizationCode() != null && !request.getAuthorizationCode().isBlank()) {
            connection.setAuthorizationCode(request.getAuthorizationCode());
        }
        if (request.getAuthorizationState() != null) {
            connection.setAuthorizationState(request.getAuthorizationState());
        }
        connection.setAccessToken(request.getAccessToken());
        connection.setRefreshToken(request.getRefreshToken());
        connection.setUserSeqNo(request.getUserSeqNo());
        connection.setTokenScope(request.getScope());
        connection.setTokenType(request.getTokenType());
        connection.setAccessTokenExpiresIn(request.getExpiresIn());
        connection.setTokenExchangedAt(Timestamp.from(Instant.now()));
        connection.setStatus("ACTIVE");
        connection.setLastErrorMessage(null);
        financialConnectionRepository.save(connection);

        maybeAutoSyncKftcConnection(connection);

        return KftcTokenExchangeCallbackResult.builder()
                .userId(user.getUserId())
                .connectionId(connection.getConnectionId())
                .status(connection.getStatus())
                .message("토큰 교환 결과가 저장되었습니다.")
                .userSeqNo(connection.getUserSeqNo())
                .tokenScope(connection.getTokenScope())
                .build();
    }

    @Override
    @Transactional
    public KftcTokenExchangeCallbackResult saveKftcFintechUseNum(Long userId, String fintechUseNum) {
        User user = getUser(userId);
        FinancialConnection connection = ensureKftcConnection(user);

        connection.setFintechUseNum(fintechUseNum);
        connection.setStatus("ACTIVE");
        connection.setLastErrorMessage(null);
        financialConnectionRepository.save(connection);

        maybeAutoSyncKftcConnection(connection);

        return KftcTokenExchangeCallbackResult.builder()
                .userId(user.getUserId())
                .connectionId(connection.getConnectionId())
                .status(connection.getStatus())
                .message("fintech_use_num이 저장되었습니다.")
                .userSeqNo(connection.getUserSeqNo())
                .tokenScope(connection.getTokenScope())
                .build();
    }

    @Override
    @Transactional
    public KftcAccountRegistrationCallbackResult handleKftcAccountRegistrationCallback(KftcAccountRegistrationCallbackRequest request) {
        User user = getUser(request.getUserId());
        FinancialConnection connection = ensureKftcConnection(user);

        if (request.getCode() != null && !request.getCode().isBlank()) {
            connection.setAuthorizationCode(request.getCode());
        }
        if (request.getState() != null && !request.getState().isBlank()) {
            connection.setAuthorizationState(request.getState());
        }
        if (request.getFintechUseNum() != null && !request.getFintechUseNum().isBlank()) {
            connection.setFintechUseNum(request.getFintechUseNum());
        }
        connection.setSelectedBankCodeStd(request.getBankCodeStd());
        connection.setSelectedAccountNum(request.getAccountNum());
        connection.setSelectedAccountSeq(request.getAccountSeq());
        connection.setSelectedAccountName(request.getAccountName());
        connection.setSelectedAccountLocalCode(request.getAccountLocalCode());
        connection.setAuthorizationReceivedAt(Timestamp.from(Instant.now()));
        connection.setStatus("ACCOUNT_REGISTERED");
        connection.setLastErrorMessage(null);
        financialConnectionRepository.save(connection);

        TokenExchangeAttempt tokenExchangeAttempt = attemptKftcTokenExchange(connection);
        maybeAutoSyncKftcConnection(connection);

        return KftcAccountRegistrationCallbackResult.builder()
                .userId(user.getUserId())
                .connectionId(connection.getConnectionId())
                .status(connection.getStatus())
                .message(tokenExchangeAttempt.accountRegistrationMessage())
                .fintechUseNum(connection.getFintechUseNum())
                .bankCodeStd(connection.getSelectedBankCodeStd())
                .accountNum(connection.getSelectedAccountNum())
                .accountSeq(connection.getSelectedAccountSeq())
                .accountName(connection.getSelectedAccountName())
                .accountLocalCode(connection.getSelectedAccountLocalCode())
                .build();
    }

    @Override
    @Transactional
    public TransactionSyncResult importSampleTransactions(SampleImportRequest request) {
        User user = getUser(request.getUserId());
        FinancialConnection connection = financialConnectionRepository
                .findByUserUserIdAndProvider(user.getUserId(), FinancialDataProvider.KFTC_OPEN_BANKING)
                .stream()
                .findFirst()
                .orElseGet(() -> financialConnectionRepository.save(FinancialConnection.builder()
                        .user(user)
                        .provider(FinancialDataProvider.KFTC_OPEN_BANKING)
                        .connectionReference("kftc-sample-" + user.getUserId())
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
                .provider(FinancialDataProvider.KFTC_OPEN_BANKING)
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
        String providerTransactionId = "kftc-sample-" + merchantName + "-" + postedAt.toLocalDate();
        return NormalizedTransactionRecord.builder()
                .provider(FinancialDataProvider.KFTC_OPEN_BANKING)
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

    @Override
    public KftcAccountInfoResponse listKftcAccounts(KftcAccountInfoRequest request) {
        User user = getUser(request.getUserId());
        FinancialConnection connection = resolveKftcConnection(user.getUserId(), request.getConnectionId());

        KftcAccountInfoRequest resolvedRequest = KftcAccountInfoRequest.builder()
                .userId(user.getUserId())
                .connectionId(connection.getConnectionId())
                .accessToken(firstNonBlank(request.getAccessToken(), connection.getAccessToken()))
                .authCode(firstNonBlank(request.getAuthCode(), connection.getAuthorizationCode()))
                .inquiryBankType(firstNonBlank(request.getInquiryBankType(), "1"))
                .build();

        BankConnector connector = bankConnectorRegistry.get(FinancialDataProvider.KFTC_OPEN_BANKING);
        if (!(connector instanceof KftcOpenBankingConnector kftcConnector)) {
            throw new IllegalStateException("KFTC connector를 찾을 수 없습니다.");
        }
        if (resolvedRequest.getAuthCode() == null || resolvedRequest.getAuthCode().isBlank()) {
            throw new IllegalStateException("KFTC authorization code가 없습니다. 먼저 계좌등록을 완료하세요.");
        }
        return kftcConnector.listAccounts(resolvedRequest);
    }

    @Override
    public KftcRegisteredAccountResponse listKftcRegisteredAccounts(KftcRegisteredAccountRequest request) {
        User user = getUser(request.getUserId());
        FinancialConnection connection = resolveKftcConnection(user.getUserId(), request.getConnectionId());

        BankConnector connector = bankConnectorRegistry.get(FinancialDataProvider.KFTC_OPEN_BANKING);
        if (!(connector instanceof KftcOpenBankingConnector kftcConnector)) {
            throw new IllegalStateException("KFTC connector를 찾을 수 없습니다.");
        }
        if (connection.getAccessToken() == null || connection.getAccessToken().isBlank()) {
            throw new IllegalStateException("KFTC access token이 없습니다. 먼저 인증과 토큰 교환을 완료하세요.");
        }
        if (connection.getUserSeqNo() == null || connection.getUserSeqNo().isBlank()) {
            throw new IllegalStateException("KFTC user_seq_no가 없습니다. 먼저 토큰 교환을 완료하세요.");
        }

        return kftcConnector.listRegisteredAccounts(connection.getAccessToken(), connection.getUserSeqNo());
    }

    @Override
    @Transactional
    public KftcSelectedAccountResult saveKftcSelectedAccount(KftcSelectedAccountRequest request) {
        User user = getUser(request.getUserId());
        FinancialConnection connection = ensureKftcConnection(user);

        connection.setSelectedBankCodeStd(request.getBankCodeStd());
        connection.setSelectedAccountNum(request.getAccountNum());
        connection.setSelectedAccountSeq(request.getAccountSeq());
        connection.setSelectedAccountName(request.getAccountName());
        connection.setSelectedAccountLocalCode(request.getAccountLocalCode());
        connection.setStatus("ACCOUNT_SELECTED");
        connection.setLastErrorMessage(null);
        financialConnectionRepository.save(connection);

        AutoSyncOutcome autoSyncOutcome = maybeAutoSyncKftcConnection(connection);

        return KftcSelectedAccountResult.builder()
                .userId(user.getUserId())
                .connectionId(connection.getConnectionId())
                .status(connection.getStatus())
                .message(autoSyncOutcome.message())
                .bankCodeStd(connection.getSelectedBankCodeStd())
                .accountNum(connection.getSelectedAccountNum())
                .accountSeq(connection.getSelectedAccountSeq())
                .accountName(connection.getSelectedAccountName())
                .accountLocalCode(connection.getSelectedAccountLocalCode())
                .syncTriggered(autoSyncOutcome.triggered())
                .syncedRecordCount(autoSyncOutcome.syncedRecordCount())
                .nextCursor(autoSyncOutcome.nextCursor())
                .hasMore(autoSyncOutcome.hasMore())
                .build();
    }

    @Override
    @Transactional
    public KftcSelectedAccountResult saveKftcRegisteredAccountSelection(KftcRegisteredAccountSelectionRequest request) {
        User user = getUser(request.getUserId());
        FinancialConnection connection = ensureKftcConnection(user);

        connection.setFintechUseNum(request.getFintechUseNum());
        connection.setSelectedBankCodeStd(request.getBankCodeStd());
        connection.setSelectedAccountNum(request.getAccountNumMasked());
        connection.setSelectedAccountName(firstNonBlank(request.getAccountAlias(), request.getAccountHolderName()));
        connection.setStatus("ACCOUNT_SELECTED");
        connection.setLastErrorMessage(null);
        financialConnectionRepository.save(connection);

        AutoSyncOutcome autoSyncOutcome = maybeAutoSyncKftcConnection(connection);

        return KftcSelectedAccountResult.builder()
                .userId(user.getUserId())
                .connectionId(connection.getConnectionId())
                .status(connection.getStatus())
                .message(autoSyncOutcome.message())
                .bankCodeStd(connection.getSelectedBankCodeStd())
                .accountNum(connection.getSelectedAccountNum())
                .accountSeq(connection.getSelectedAccountSeq())
                .accountName(connection.getSelectedAccountName())
                .accountLocalCode(connection.getSelectedAccountLocalCode())
                .syncTriggered(autoSyncOutcome.triggered())
                .syncedRecordCount(autoSyncOutcome.syncedRecordCount())
                .nextCursor(autoSyncOutcome.nextCursor())
                .hasMore(autoSyncOutcome.hasMore())
                .build();
    }

    @Override
    @Transactional
    public KftcReconnectResult resetKftcConnection(KftcReconnectRequest request) {
        User user = getUser(request.getUserId());
        FinancialConnection connection = resolveKftcConnection(user.getUserId(), request.getConnectionId());

        if (connection.getProvider() != FinancialDataProvider.KFTC_OPEN_BANKING) {
            throw new IllegalArgumentException("KFTC 연결만 재연결할 수 있습니다.");
        }

        Long connectionId = connection.getConnectionId();
        Integer deletedTransactionCount = normalizedTransactionRepository
                .findByConnectionConnectionIdOrderByPostedAtDesc(connectionId)
                .size();
        normalizedTransactionRepository.deleteByConnectionConnectionId(connectionId);
        financialConnectionRepository.delete(connection);

        return KftcReconnectResult.builder()
                .userId(user.getUserId())
                .connectionId(connectionId)
                .status("RESET")
                .message("KFTC 연결을 해제했습니다. 다시 계좌등록을 시작할 수 있습니다.")
                .deletedTransactionCount(deletedTransactionCount)
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
            if (isKftcConsentExpired(e)) {
                connection.setStatus("CONSENT_EXPIRED");
                connection.setLastErrorMessage("KFTC 제3자제공동의가 만료되었습니다. 오픈뱅킹 계좌등록을 다시 진행해야 합니다.");
                financialConnectionRepository.save(connection);
                throw new IllegalArgumentException("KFTC 제3자제공동의가 만료되었습니다. 오픈뱅킹 계좌등록을 다시 진행해주세요.");
            } else {
                connection.setLastErrorMessage(e.getMessage());
                financialConnectionRepository.save(connection);
                throw e;
            }
        }
    }

    private AutoSyncOutcome maybeAutoSyncKftcConnection(FinancialConnection connection) {
        if (connection.getProvider() != FinancialDataProvider.KFTC_OPEN_BANKING) {
            return AutoSyncOutcome.notTriggered("자동 거래 동기화 대상이 아닙니다.");
        }
        if (!hasSelectedKftcAccount(connection)) {
            return AutoSyncOutcome.notTriggered("선택 계좌가 저장되면 자동 거래 동기화를 시작합니다.");
        }
        if (connection.getAccessToken() == null || connection.getAccessToken().isBlank()) {
            return AutoSyncOutcome.notTriggered("KFTC access token 저장 후 자동 거래 동기화를 시작합니다.");
        }
        if (connection.getFintechUseNum() == null || connection.getFintechUseNum().isBlank()) {
            return AutoSyncOutcome.notTriggered("fintech_use_num 저장 후 자동 거래 동기화를 시작합니다.");
        }

        try {
            TransactionSyncResult result = syncConnectionTransactions(connection, connection.getUser().getUserId());
            return AutoSyncOutcome.triggered(result);
        } catch (RuntimeException e) {
            if (isKftcConsentExpired(e)) {
                connection.setStatus("CONSENT_EXPIRED");
                connection.setLastErrorMessage("KFTC 제3자제공동의가 만료되었습니다. 오픈뱅킹 계좌등록을 다시 진행해야 합니다.");
                connection.setFintechUseNum(null);
                connection.setSelectedBankCodeStd(null);
                connection.setSelectedAccountNum(null);
                connection.setSelectedAccountSeq(null);
                connection.setSelectedAccountName(null);
                connection.setSelectedAccountLocalCode(null);
            } else {
                connection.setLastErrorMessage(e.getMessage());
            }
            financialConnectionRepository.save(connection);
            return AutoSyncOutcome.notTriggered("자동 거래 동기화에 실패했습니다. 저장된 계좌로 다시 시도할 수 있습니다.");
        }
    }

    private TokenExchangeAttempt attemptKftcTokenExchange(FinancialConnection connection) {
        if (connection.getProvider() != FinancialDataProvider.KFTC_OPEN_BANKING) {
            return TokenExchangeAttempt.notAttempted("KFTC 연결이 아니므로 토큰 교환을 건너뜁니다.");
        }
        if (connection.getAuthorizationCode() == null || connection.getAuthorizationCode().isBlank()) {
            return TokenExchangeAttempt.notAttempted("인가 코드를 저장했지만 토큰 교환에 필요한 code가 없습니다.");
        }

        BankConnector connector = bankConnectorRegistry.get(FinancialDataProvider.KFTC_OPEN_BANKING);
        if (!(connector instanceof KftcOpenBankingConnector kftcConnector)) {
            throw new IllegalStateException("KFTC connector를 찾을 수 없습니다.");
        }

        try {
            KftcTokenExchangeResult result = kftcConnector.exchangeAuthorizationCode(KftcTokenExchangeRequest.builder()
                    .userId(connection.getUser().getUserId())
                    .authorizationCode(connection.getAuthorizationCode())
                    .redirectUri(null)
                    .clientId(null)
                    .clientSecret(null)
                    .grantType("authorization_code")
                    .build());

            connection.setAccessToken(result.getAccessToken());
            connection.setRefreshToken(result.getRefreshToken());
            connection.setUserSeqNo(result.getUserSeqNo());
            connection.setTokenScope(result.getScope());
            connection.setTokenType(result.getTokenType());
            connection.setAccessTokenExpiresIn(result.getExpiresIn());
            connection.setTokenExchangedAt(Timestamp.from(Instant.now()));
            connection.setProviderAccountReference(firstNonBlank(result.getUserSeqNo(), connection.getProviderAccountReference()));
            connection.setStatus("ACTIVE");
            connection.setLastErrorMessage(null);
            financialConnectionRepository.save(connection);

            return TokenExchangeAttempt.success("인가 코드와 토큰 교환까지 완료되었습니다. 계좌통합조회를 진행할 수 있습니다.");
        } catch (RuntimeException e) {
            connection.setLastErrorMessage(e.getMessage());
            financialConnectionRepository.save(connection);
            return TokenExchangeAttempt.failure("인가 코드는 저장했지만 토큰 교환은 실패했습니다. 설정값과 KFTC 앱 등록 정보를 확인하세요.");
        }
    }

    private boolean hasSelectedKftcAccount(FinancialConnection connection) {
        return firstNonBlank(
                connection.getSelectedAccountNum(),
                connection.getSelectedAccountSeq(),
                connection.getSelectedAccountName()
        ) != null;
    }

    private boolean isKftcConsentExpired(Throwable throwable) {
        String message = throwable == null ? null : throwable.getMessage();
        if (message == null) {
            return false;
        }

        String normalized = message.toLowerCase();
        return normalized.contains("제3자제공동의 만료")
                || normalized.contains("정보제공 재동의대상")
                || normalized.contains("재동의대상")
                || normalized.contains("consent expired")
                || normalized.contains("re-consent");
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private FinancialConnection resolveKftcConnection(Long userId, Long connectionId) {
        if (connectionId != null) {
            FinancialConnection connection = financialConnectionRepository.findById(connectionId)
                    .orElseThrow(() -> new CustomNotFoundException("KFTC 연결 정보를 찾을 수 없습니다."));
            if (!connection.getUser().getUserId().equals(userId)) {
                throw new IllegalArgumentException("본인의 연결만 사용할 수 있습니다.");
            }
            return connection;
        }

        return ensureKftcConnection(getUser(userId));
    }

    private FinancialConnection ensureKftcConnection(User user) {
        return financialConnectionRepository
                .findByUserUserIdAndProvider(user.getUserId(), FinancialDataProvider.KFTC_OPEN_BANKING)
                .stream()
                .findFirst()
                .orElseGet(() -> financialConnectionRepository.save(FinancialConnection.builder()
                        .user(user)
                        .provider(FinancialDataProvider.KFTC_OPEN_BANKING)
                        .connectionReference("kftc-conn-" + user.getUserId())
                        .providerAccountReference("kftc-account-" + user.getUserId())
                        .status("PENDING_AUTHORIZATION")
                        .build()));
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

        return resolveKftcConnection(userId, null);
    }

    private record AutoSyncOutcome(
            boolean triggered,
            String message,
            Integer syncedRecordCount,
            String nextCursor,
            Boolean hasMore
    ) {
        private static AutoSyncOutcome triggered(TransactionSyncResult result) {
            return new AutoSyncOutcome(
                    true,
                    "선택 계좌와 fintech_use_num을 기준으로 거래 동기화를 완료했습니다.",
                    result.getRecords().size(),
                    result.getNextCursor(),
                    result.isHasMore()
            );
        }

        private static AutoSyncOutcome notTriggered(String message) {
            return new AutoSyncOutcome(false, message, null, null, null);
        }
    }

    private record TokenExchangeAttempt(
            boolean exchanged,
            String message
    ) {
        private static TokenExchangeAttempt success(String message) {
            return new TokenExchangeAttempt(true, message);
        }

        private static TokenExchangeAttempt failure(String message) {
            return new TokenExchangeAttempt(false, message);
        }

        private static TokenExchangeAttempt notAttempted(String message) {
            return new TokenExchangeAttempt(false, message);
        }

        private String accountRegistrationMessage() {
            return exchanged
                    ? "계좌등록 결과와 토큰 교환을 저장했습니다. 계좌통합조회 또는 거래 동기화를 진행할 수 있습니다."
                    : message;
        }
    }
}
