package com.example.ezpay.modules.bankconnector.internal.service;

import com.example.ezpay.modules.bankconnector.api.BankConnector;
import com.example.ezpay.modules.bankconnector.api.dto.ConnectionExchangeCommand;
import com.example.ezpay.modules.bankconnector.api.dto.ConnectionExchangeResult;
import com.example.ezpay.modules.bankconnector.api.dto.ConnectionLinkToken;
import com.example.ezpay.modules.bankconnector.api.dto.KftcAccountInfoItem;
import com.example.ezpay.modules.bankconnector.api.dto.KftcAccountInfoRequest;
import com.example.ezpay.modules.bankconnector.api.dto.KftcAccountInfoResponse;
import com.example.ezpay.modules.bankconnector.api.dto.KftcAuthorizationRequest;
import com.example.ezpay.modules.bankconnector.api.dto.KftcRegisteredAccountItem;
import com.example.ezpay.modules.bankconnector.api.dto.KftcRegisteredAccountResponse;
import com.example.ezpay.modules.bankconnector.api.dto.KftcTokenExchangeRequest;
import com.example.ezpay.modules.bankconnector.api.dto.KftcTokenExchangeResult;
import com.example.ezpay.modules.bankconnector.api.dto.KftcTransactionInquiryRequest;
import com.example.ezpay.modules.bankconnector.api.dto.KftcTransactionInquiryResponse;
import com.example.ezpay.modules.bankconnector.api.dto.KftcTransactionInquiryItem;
import com.example.ezpay.modules.bankconnector.api.dto.TransactionSyncRequest;
import com.example.ezpay.modules.bankconnector.api.dto.TransactionSyncResult;
import com.example.ezpay.shared.common.enums.FinancialDataProvider;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.math.BigDecimal;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Slf4j
@Component
public class KftcOpenBankingConnector implements BankConnector {
    private static final String AUTH_STATE_PREFIX = "kftc";
    private static final int AUTH_STATE_USER_ID_LENGTH = 10;
    private static final int AUTH_STATE_TOTAL_LENGTH = 32;
    private final KftcOpenBankingProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newHttpClient();
    private static final String NOT_READY_MESSAGE =
            "KFTC Open Banking connector는 아직 사용자 동의 및 거래내역조회 API 연동 전입니다.";

    public KftcOpenBankingConnector(KftcOpenBankingProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    @Override
    public FinancialDataProvider provider() {
        return FinancialDataProvider.KFTC_OPEN_BANKING;
    }

    @Override
    public ConnectionLinkToken createLinkToken(Long userId) {
        validateAuthorizationConfiguration();

        String authorizeUrl = properties.getAuthorizeUrl();

        KftcAuthorizationRequest request = KftcAuthorizationRequest.builder()
                .userId(userId)
                .clientId(properties.getClientId())
                .redirectUri(properties.getRedirectUri())
                .responseType("code")
                .scope(properties.getScope())
                .clientUseCode(properties.getClientUseCode())
                .state(generateAuthorizationState(userId))
                .authType(properties.getAuthType() != null ? properties.getAuthType() : "0")
                .build();

        StringBuilder uriBuilder = new StringBuilder(authorizeUrl)
                .append("?response_type=").append(encode(request.getResponseType()))
                .append("&client_id=").append(encode(request.getClientId()))
                .append("&redirect_uri=").append(encode(request.getRedirectUri()))
                .append("&scope=").append(encode(request.getScope()))
                .append("&state=").append(encode(request.getState()))
                .append("&auth_type=").append(encode(request.getAuthType()));

        if (request.getClientUseCode() != null && !request.getClientUseCode().isBlank()) {
            uriBuilder.append("&client_info=").append(encode(request.getClientUseCode()));
        }

        return ConnectionLinkToken.builder()
                .provider(provider())
                .linkToken(uriBuilder.toString())
                .expiresAt(null)
                .build();
    }

    @Override
    public ConnectionExchangeResult exchangeConnection(ConnectionExchangeCommand command) {
        KftcTokenExchangeRequest request = KftcTokenExchangeRequest.builder()
                .userId(command.getUserId())
                .authorizationCode(command.getPublicToken())
                .redirectUri(properties.getRedirectUri())
                .clientId(properties.getClientId())
                .clientSecret(properties.getClientSecret())
                .grantType("authorization_code")
                .build();

        KftcTokenExchangeResult result = exchangeAuthorizationCode(request);
        return ConnectionExchangeResult.builder()
                .provider(provider())
                .connectionReference("kftc-conn-" + command.getUserId())
                .providerAccountReference(result.getUserSeqNo())
                .accessToken(result.getAccessToken())
                .build();
    }

    @Override
    public TransactionSyncResult syncTransactions(TransactionSyncRequest request) {
        if (request.getAccessToken() == null || request.getAccessToken().isBlank()) {
            throw new IllegalArgumentException("KFTC access token이 필요합니다.");
        }
        if (request.getFintechUseNum() == null || request.getFintechUseNum().isBlank()) {
            throw new IllegalArgumentException("KFTC fintech_use_num이 필요합니다.");
        }

        String[] inquiryWindow = resolveInquiryDateWindow();

        KftcTransactionInquiryRequest inquiryRequest = KftcTransactionInquiryRequest.builder()
                .userId(request.getUserId())
                .accessToken(request.getAccessToken())
                .fintechUseNum(request.getFintechUseNum())
                .bankTranId(generateBankTranId(request.getUserId()))
                .inquiryType("A")
                .inquiryBase("D")
                .fromDate(inquiryWindow[0])
                .toDate(inquiryWindow[1])
                .fromTime("000000")
                .toTime("235959")
                .sortOrder("D")
                .pageIndex("1")
                .pageRecordCnt("25")
                .beforInquiryTraceInfo(sanitizeInquiryCursor(request.getCursor()))
                .build();

        KftcTransactionInquiryResponse response = callTransactionInquiry(inquiryRequest);
        List<com.example.ezpay.modules.bankconnector.api.dto.NormalizedTransactionRecord> records = new ArrayList<>();
        for (KftcTransactionInquiryItem item : response.getResList()) {
            records.add(mapTransaction(item, inquiryRequest.getFintechUseNum(), response.getBankName()));
        }

        return TransactionSyncResult.builder()
                .provider(provider())
                .nextCursor("Y".equalsIgnoreCase(response.getNextPageYn())
                        ? response.getBeforInquiryTraceInfo()
                        : null)
                .hasMore("Y".equalsIgnoreCase(response.getNextPageYn()))
                .records(records)
                .build();
    }

    public KftcAccountInfoResponse listAccounts(KftcAccountInfoRequest request) {
        if (request.getAuthCode() == null || request.getAuthCode().isBlank()) {
            throw new IllegalArgumentException("KFTC auth_code가 필요합니다.");
        }

        try {
            KftcTokenExchangeResult serviceToken = exchangeAccountInfoToken();

            com.fasterxml.jackson.databind.node.ObjectNode body = objectMapper.createObjectNode();
            body.put("auth_code", request.getAuthCode());
            body.put("inquiry_bank_type", request.getInquiryBankType() == null || request.getInquiryBankType().isBlank()
                    ? "1"
                    : request.getInquiryBankType());
            body.put("trace_no", "000001");
            body.put("inquiry_record_cnt", "30");

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(properties.getBaseUrl() + "/v2.0/accountinfo/list"))
                    .header("Authorization", "Bearer " + serviceToken.getAccessToken())
                    .header("Content-Type", "application/json; charset=UTF-8")
                    .POST(HttpRequest.BodyPublishers.ofString(writeJson(body)))
                    .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400) {
                throw new IllegalArgumentException("KFTC 계좌통합조회 호출 실패: " + response.body());
            }

            JsonNode json = objectMapper.readTree(response.body());
            if (json.hasNonNull("rsp_code") && !"A0000".equals(json.path("rsp_code").asText())) {
                throw new IllegalArgumentException("KFTC 계좌통합조회 오류: " + json.path("rsp_message").asText());
            }
            return mapAccountInfoResponse(json);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("KFTC 계좌통합조회 호출 중 오류가 발생했습니다.", e);
        } catch (IOException e) {
            throw new IllegalStateException("KFTC 계좌통합조회 호출 중 오류가 발생했습니다.", e);
        }
    }

    public KftcRegisteredAccountResponse listRegisteredAccounts(String accessToken, String userSeqNo) {
        if (accessToken == null || accessToken.isBlank()) {
            throw new IllegalArgumentException("KFTC access token이 필요합니다.");
        }
        if (userSeqNo == null || userSeqNo.isBlank()) {
            throw new IllegalArgumentException("KFTC user_seq_no가 필요합니다.");
        }

        try {
            String requestUri = properties.getBaseUrl()
                    + "/v2.0/user/me?user_seq_no="
                    + encode(userSeqNo);

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(requestUri))
                    .header("Authorization", "Bearer " + accessToken)
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400) {
                throw new IllegalArgumentException("KFTC 등록 계좌 조회 호출 실패: " + response.body());
            }

            JsonNode json = objectMapper.readTree(response.body());
            if (json.hasNonNull("rsp_code") && !"A0000".equals(json.path("rsp_code").asText())) {
                throw new IllegalArgumentException("KFTC 등록 계좌 조회 오류: " + json.path("rsp_message").asText());
            }

            log.info(
                    "KFTC registered accounts response: rsp_code={}, rsp_message={}, res_cnt={}, user_seq_no={}",
                    optionalText(json, "rsp_code"),
                    optionalText(json, "rsp_message"),
                    optionalText(json, "res_cnt"),
                    userSeqNo
            );

            List<KftcRegisteredAccountItem> items = new ArrayList<>();
            JsonNode resList = json.path("res_list");
            if (resList.isArray()) {
                for (JsonNode node : resList) {
                    items.add(KftcRegisteredAccountItem.builder()
                            .fintechUseNum(optionalText(node, "fintech_use_num"))
                            .accountAlias(optionalText(node, "account_alias"))
                            .bankCodeStd(optionalText(node, "bank_code_std"))
                            .bankName(optionalText(node, "bank_name"))
                            .accountNumMasked(optionalText(node, "account_num_masked"))
                            .accountHolderName(optionalText(node, "account_holder_name"))
                            .accountType(optionalText(node, "account_type"))
                            .inquiryAgreeYn(optionalText(node, "inquiry_agree_yn"))
                            .transferAgreeYn(optionalText(node, "transfer_agree_yn"))
                            .build());
                }
            }

            return KftcRegisteredAccountResponse.builder()
                    .apiTranId(optionalText(json, "api_tran_id"))
                    .apiTranDtm(optionalText(json, "api_tran_dtm"))
                    .rspCode(optionalText(json, "rsp_code"))
                    .rspMessage(optionalText(json, "rsp_message"))
                    .userSeqNo(optionalText(json, "user_seq_no"))
                    .userName(optionalText(json, "user_name"))
                    .resCnt(optionalText(json, "res_cnt"))
                    .resList(items)
                    .build();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("KFTC 등록 계좌 조회 호출 중 오류가 발생했습니다.", e);
        } catch (IOException e) {
            throw new IllegalStateException("KFTC 등록 계좌 조회 호출 중 오류가 발생했습니다.", e);
        }
    }

    public KftcTokenExchangeResult exchangeAuthorizationCode(KftcTokenExchangeRequest request) {
        validateTokenExchangeConfiguration();
        if (request.getAuthorizationCode() == null || request.getAuthorizationCode().isBlank()) {
            throw new IllegalArgumentException("KFTC 토큰 교환에 authorization code가 필요합니다.");
        }

        String clientId = firstNonBlank(request.getClientId(), properties.getClientId());
        String clientSecret = firstNonBlank(request.getClientSecret(), properties.getClientSecret());
        String redirectUri = firstNonBlank(request.getRedirectUri(), properties.getRedirectUri());
        String grantType = firstNonBlank(request.getGrantType(), "authorization_code");

        String formBody = "code=" + encode(request.getAuthorizationCode())
                + "&client_id=" + encode(clientId)
                + "&client_secret=" + encode(clientSecret)
                + "&redirect_uri=" + encode(redirectUri)
                + "&grant_type=" + encode(grantType);

        try {
            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(properties.getTokenUrl()))
                    .header("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8")
                    .POST(HttpRequest.BodyPublishers.ofString(formBody))
                    .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400) {
                throw new IllegalArgumentException("KFTC 토큰 교환 호출 실패: " + response.body());
            }

            JsonNode json = objectMapper.readTree(response.body());
            if (json.hasNonNull("error")) {
                throw new IllegalArgumentException("KFTC 토큰 교환 오류: " + firstNonBlank(
                        optionalText(json, "error_description"),
                        optionalText(json, "error"),
                        response.body()
                ));
            }
            if (json.hasNonNull("rsp_code") && !"A0000".equals(json.path("rsp_code").asText())) {
                throw new IllegalArgumentException("KFTC 토큰 교환 오류: " + json.path("rsp_message").asText());
            }

            return KftcTokenExchangeResult.builder()
                    .accessToken(optionalText(json, "access_token"))
                    .refreshToken(optionalText(json, "refresh_token"))
                    .userSeqNo(optionalText(json, "user_seq_no"))
                    .scope(optionalText(json, "scope"))
                    .expiresIn(json.path("expires_in").isNumber() ? json.path("expires_in").asLong() : null)
                    .tokenType(optionalText(json, "token_type"))
                    .build();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("KFTC 토큰 교환 호출 중 오류가 발생했습니다.", e);
        } catch (IOException e) {
            throw new IllegalStateException("KFTC 토큰 교환 호출 중 오류가 발생했습니다.", e);
        }
    }

    public KftcTokenExchangeResult exchangeClientCredentialsToken(String scope) {
        validateTokenExchangeConfiguration();

        String clientId = properties.getClientId();
        String clientSecret = properties.getClientSecret();
        String resolvedScope = firstNonBlank(scope, "sa");

        String formBody = "client_id=" + encode(clientId)
                + "&client_secret=" + encode(clientSecret)
                + "&scope=" + encode(resolvedScope)
                + "&grant_type=" + encode("client_credentials");

        try {
            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(properties.getTokenUrl()))
                    .header("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8")
                    .POST(HttpRequest.BodyPublishers.ofString(formBody))
                    .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400) {
                throw new IllegalArgumentException("KFTC 이용기관 토큰 발급 호출 실패: " + response.body());
            }

            JsonNode json = objectMapper.readTree(response.body());
            if (json.hasNonNull("error")) {
                throw new IllegalArgumentException("KFTC 이용기관 토큰 발급 오류: " + firstNonBlank(
                        optionalText(json, "error_description"),
                        optionalText(json, "error"),
                        response.body()
                ));
            }
            if (json.hasNonNull("rsp_code") && !"A0000".equals(json.path("rsp_code").asText())) {
                throw new IllegalArgumentException("KFTC 이용기관 토큰 발급 오류: " + json.path("rsp_message").asText());
            }

            return KftcTokenExchangeResult.builder()
                    .accessToken(optionalText(json, "access_token"))
                    .refreshToken(optionalText(json, "refresh_token"))
                    .userSeqNo(optionalText(json, "user_seq_no"))
                    .scope(optionalText(json, "scope"))
                    .expiresIn(json.path("expires_in").isNumber() ? json.path("expires_in").asLong() : null)
                    .tokenType(optionalText(json, "token_type"))
                    .build();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("KFTC 이용기관 토큰 발급 호출 중 오류가 발생했습니다.", e);
        } catch (IOException e) {
            throw new IllegalStateException("KFTC 이용기관 토큰 발급 호출 중 오류가 발생했습니다.", e);
        }
    }

    private KftcTokenExchangeResult exchangeAccountInfoToken() {
        try {
            return exchangeClientCredentialsToken("sa");
        } catch (IllegalArgumentException e) {
            String message = e.getMessage();
            if (message == null || !message.contains("허용되지 않은 Scope")) {
                throw e;
            }
            return exchangeClientCredentialsToken("oob");
        }
    }

    private KftcAccountInfoResponse mapAccountInfoResponse(JsonNode json) {
        List<KftcAccountInfoItem> items = new ArrayList<>();
        JsonNode resList = json.path("res_list");
        if (resList.isArray()) {
            for (JsonNode node : resList) {
                items.add(KftcAccountInfoItem.builder()
                        .bankCodeStd(optionalText(node, "bank_code_std"))
                        .activityType(optionalText(node, "activity_type"))
                        .accountType(optionalText(node, "account_type"))
                        .accountNum(optionalText(node, "account_num"))
                        .accountSeq(optionalText(node, "account_seq"))
                        .accountLocalCode(optionalText(node, "account_local_code"))
                        .accountIssueDate(optionalText(node, "account_issue_date"))
                        .maturityDate(optionalText(node, "maturity_date"))
                        .lastTranDate(optionalText(node, "last_tran_date"))
                        .productName(optionalText(node, "product_name"))
                        .productSubName(optionalText(node, "product_sub_name"))
                        .dormancyYn(optionalText(node, "dormancy_yn"))
                        .balanceAmt(optionalText(node, "balance_amt"))
                        .availableAmt(optionalText(node, "available_amt"))
                        .build());
            }
        }

        return KftcAccountInfoResponse.builder()
                .apiTranId(optionalText(json, "api_tran_id"))
                .apiTranDtm(optionalText(json, "api_tran_dtm"))
                .rspCode(optionalText(json, "rsp_code"))
                .rspMessage(optionalText(json, "rsp_message"))
                .orgAinfoTranId(optionalText(json, "org_ainfo_tran_id"))
                .traceNo(optionalText(json, "trace_no"))
                .totalRecordCnt(optionalText(json, "total_record_cnt"))
                .pageRecordCnt(optionalText(json, "page_record_cnt"))
                .resList(items)
                .build();
    }

    private KftcTransactionInquiryResponse callTransactionInquiry(KftcTransactionInquiryRequest request) {
        try {
            StringBuilder uriBuilder = new StringBuilder(properties.getBaseUrl())
                    .append("/v2.0/account/transaction_list/fin_num?")
                    .append("bank_tran_id=").append(encode(request.getBankTranId()))
                    .append("&fintech_use_num=").append(encode(request.getFintechUseNum()))
                    .append("&inquiry_type=").append(encode(request.getInquiryType()))
                    .append("&inquiry_base=").append(encode(request.getInquiryBase()))
                    .append("&from_date=").append(encode(request.getFromDate()))
                    .append("&from_time=").append(encode(request.getFromTime()))
                    .append("&to_date=").append(encode(request.getToDate()))
                    .append("&to_time=").append(encode(request.getToTime()))
                    .append("&sort_order=").append(encode(request.getSortOrder()))
                    .append("&tran_dtime=").append(encode(OffsetDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))));
            if (request.getBeforInquiryTraceInfo() != null && !request.getBeforInquiryTraceInfo().isBlank()) {
                uriBuilder.append("&befor_inquiry_trace_info=").append(encode(request.getBeforInquiryTraceInfo()));
            }

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(uriBuilder.toString()))
                    .header("Authorization", "Bearer " + request.getAccessToken())
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400) {
                throw new IllegalArgumentException("KFTC 거래내역조회 호출 실패: " + response.body());
            }

            JsonNode json = objectMapper.readTree(response.body());
            if (json.hasNonNull("rsp_code") && !"A0000".equals(json.path("rsp_code").asText())) {
                throw new IllegalArgumentException("KFTC 거래내역조회 오류: " + json.path("rsp_message").asText());
            }
            return mapInquiryResponse(json);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("KFTC 거래내역조회 호출 중 오류가 발생했습니다.", e);
        } catch (IOException e) {
            throw new IllegalStateException("KFTC 거래내역조회 호출 중 오류가 발생했습니다.", e);
        }
    }

    private KftcTransactionInquiryResponse mapInquiryResponse(JsonNode json) {
        List<KftcTransactionInquiryItem> items = new ArrayList<>();
        JsonNode resList = json.path("res_list");
        if (resList.isArray()) {
            for (JsonNode node : resList) {
                items.add(KftcTransactionInquiryItem.builder()
                        .tranDate(optionalText(node, "tran_date"))
                        .tranTime(optionalText(node, "tran_time"))
                        .inoutType(optionalText(node, "inout_type"))
                        .tranType(optionalText(node, "tran_type"))
                        .printedContent(firstNonBlank(optionalText(node, "printed_content"), optionalText(node, "print_content")))
                        .tranAmt(optionalText(node, "tran_amt"))
                        .afterBalanceAmt(optionalText(node, "after_balance_amt"))
                        .branchName(optionalText(node, "branch_name"))
                        .build());
            }
        }

        return KftcTransactionInquiryResponse.builder()
                .apiTranId(optionalText(json, "api_tran_id"))
                .apiTranDtm(optionalText(json, "api_tran_dtm"))
                .rspCode(optionalText(json, "rsp_code"))
                .rspMessage(optionalText(json, "rsp_message"))
                .bankTranId(optionalText(json, "bank_tran_id"))
                .bankTranDate(optionalText(json, "bank_tran_date"))
                .bankCodeTran(optionalText(json, "bank_code_tran"))
                .bankRspCode(optionalText(json, "bank_rsp_code"))
                .bankRspMessage(optionalText(json, "bank_rsp_message"))
                .bankName(optionalText(json, "bank_name"))
                .savingsBankName(optionalText(json, "savings_bank_name"))
                .fintechUseNum(optionalText(json, "fintech_use_num"))
                .balanceAmt(optionalText(json, "balance_amt"))
                .pageRecordCnt(optionalText(json, "page_record_cnt"))
                .nextPageYn(optionalText(json, "next_page_yn"))
                .beforInquiryTraceInfo(optionalText(json, "befor_inquiry_trace_info"))
                .resList(items)
                .build();
    }

    private com.example.ezpay.modules.bankconnector.api.dto.NormalizedTransactionRecord mapTransaction(
            KftcTransactionInquiryItem item,
            String fintechUseNum,
            String bankName
    ) {
        OffsetDateTime postedAt = parseKftcDateTime(item.getTranDate(), item.getTranTime());
        BigDecimal amount = safeBigDecimal(item.getTranAmt());
        String direction = "입금".equals(item.getInoutType()) ? "INFLOW" : "OUTFLOW";
        String primaryCategory = inferPrimaryCategory(item.getPrintedContent(), item.getTranType());

        return com.example.ezpay.modules.bankconnector.api.dto.NormalizedTransactionRecord.builder()
                .provider(provider())
                .providerTransactionId(fintechUseNum + "-" + item.getTranDate() + "-" + item.getTranTime() + "-" + UUID.randomUUID())
                .providerAccountId(fintechUseNum)
                .postedAt(postedAt)
                .authorizedAt(postedAt)
                .amount(amount)
                .currencyCode("KRW")
                .merchantName(firstNonBlank(item.getPrintedContent(), bankName))
                .description(firstNonBlank(item.getPrintedContent(), item.getTranType()))
                .primaryCategory(primaryCategory)
                .detailedCategory(item.getTranType())
                .pending(false)
                .direction(direction)
                .providerBranchName(item.getBranchName())
                .rawPayload(writeJson(item))
                .build();
    }

    private String inferPrimaryCategory(String printedContent, String tranType) {
        String text = (printedContent + " " + tranType).toLowerCase();
        if (text.contains("배달") || text.contains("배민")) return "FOOD_AND_DRINK";
        if (text.contains("카페") || text.contains("스타벅스")) return "FOOD_AND_DRINK";
        if (text.contains("마트") || text.contains("이마트") || text.contains("쿠팡") || text.contains("오늘의집")) return "GENERAL_MERCHANDISE";
        if (text.contains("통신") || text.contains("skt") || text.contains("kt") || text.contains("lg u+")) return "BILLS_AND_UTILITIES";
        if (text.contains("택시") || text.contains("카카오t")) return "TRANSPORTATION";
        return "UNCATEGORIZED";
    }

    private OffsetDateTime parseKftcDateTime(String date, String time) {
        if (date == null || date.isBlank()) {
            return null;
        }
        String hhmmss = time == null || time.isBlank() ? "000000" : time;
        LocalDateTime localDateTime = LocalDateTime.parse(
                date + hhmmss,
                DateTimeFormatter.ofPattern("yyyyMMddHHmmss")
        );
        return localDateTime.atOffset(ZoneOffset.ofHours(9));
    }

    private BigDecimal safeBigDecimal(String value) {
        if (value == null || value.isBlank()) {
            return BigDecimal.ZERO;
        }
        return new BigDecimal(value.replace(",", "").trim());
    }

    private String[] resolveInquiryDateWindow() {
        LocalDate today = LocalDate.now(ZoneOffset.ofHours(9));
        LocalDate defaultStart = today.minusDays(89);

        LocalDate configuredStart = parseYyyyMmDd(properties.getInquiryStartDate());
        LocalDate configuredEnd = parseYyyyMmDd(properties.getInquiryEndDate());

        LocalDate resolvedEnd = configuredEnd == null || configuredEnd.isAfter(today) ? today : configuredEnd;
        LocalDate resolvedStart = configuredStart == null ? defaultStart : configuredStart;

        if (resolvedStart.isAfter(resolvedEnd)) {
            resolvedStart = resolvedEnd.minusDays(89);
        }

        return new String[] {
                resolvedStart.format(DateTimeFormatter.BASIC_ISO_DATE),
                resolvedEnd.format(DateTimeFormatter.BASIC_ISO_DATE)
        };
    }

    private LocalDate parseYyyyMmDd(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return LocalDate.parse(value, DateTimeFormatter.BASIC_ISO_DATE);
    }

    private String sanitizeInquiryCursor(String cursor) {
        if (cursor == null) {
            return null;
        }

        String trimmed = cursor.trim();
        if (trimmed.isEmpty() || "null".equalsIgnoreCase(trimmed)) {
            return null;
        }

        // KFTC expects AN values here. Skip stale or malformed cursors instead of
        // sending them back and failing the whole first-page sync request.
        return trimmed.matches("[A-Za-z0-9]+") ? trimmed : null;
    }

    private String generateBankTranId(Long userId) {
        String clientUseCode = firstNonBlank(properties.getClientUseCode(), "");
        if (clientUseCode.length() != 10) {
            throw new IllegalStateException("KFTC client_use_code는 10자리여야 합니다: " + clientUseCode);
        }

        long randomValue = ThreadLocalRandom.current().nextLong(1_000_000_000L);
        long mixedValue = Math.floorMod((userId == null ? 0L : userId) * 1_000_003L + randomValue, 1_000_000_000L);
        String suffix = String.format("%09d", mixedValue);
        return clientUseCode + "U" + suffix;
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("JSON 직렬화에 실패했습니다.", e);
        }
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
    }

    private String optionalText(JsonNode node, String fieldName) {
        JsonNode child = node.path(fieldName);
        return child.isMissingNode() || child.isNull() ? null : child.asText();
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private void validateAuthorizationConfiguration() {
        if (!properties.isEnabled()) {
            throw new IllegalArgumentException("KFTC Open Banking이 비활성화되어 있습니다. `EZPAY_KFTC_ENABLED=true`로 설정하세요.");
        }
        requireProperty(properties.getAuthorizeUrl(), "KFTC_AUTHORIZE_URL");
        requireProperty(properties.getClientId(), "KFTC_CLIENT_ID");
        requireProperty(properties.getRedirectUri(), "KFTC_REDIRECT_URI");
    }

    private void validateTokenExchangeConfiguration() {
        if (!properties.isEnabled()) {
            throw new IllegalArgumentException("KFTC Open Banking이 비활성화되어 있습니다. `EZPAY_KFTC_ENABLED=true`로 설정하세요.");
        }
        requireProperty(properties.getTokenUrl(), "KFTC_TOKEN_URL");
        requireProperty(properties.getClientId(), "KFTC_CLIENT_ID");
        requireProperty(properties.getClientSecret(), "KFTC_CLIENT_SECRET");
        requireProperty(properties.getRedirectUri(), "KFTC_REDIRECT_URI");
    }

    private void requireProperty(String value, String propertyName) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("KFTC 계좌등록 시작에 필요한 `" + propertyName + "` 설정이 없습니다.");
        }
    }

    private String generateAuthorizationState(Long userId) {
        StringBuilder state = new StringBuilder(AUTH_STATE_TOTAL_LENGTH)
                .append(AUTH_STATE_PREFIX)
                .append(String.format("%0" + AUTH_STATE_USER_ID_LENGTH + "d", userId));

        while (state.length() < AUTH_STATE_TOTAL_LENGTH) {
            state.append(ThreadLocalRandom.current().nextInt(10));
        }

        return state.toString();
    }
}
