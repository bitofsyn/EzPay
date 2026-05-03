package com.example.ezpay.modules.bankconnector.internal.service;

import com.example.ezpay.modules.bankconnector.api.BankConnector;
import com.example.ezpay.modules.bankconnector.api.dto.ConnectionExchangeCommand;
import com.example.ezpay.modules.bankconnector.api.dto.ConnectionExchangeResult;
import com.example.ezpay.modules.bankconnector.api.dto.ConnectionLinkToken;
import com.example.ezpay.modules.bankconnector.api.dto.NormalizedTransactionRecord;
import com.example.ezpay.modules.bankconnector.api.dto.TransactionSyncRequest;
import com.example.ezpay.modules.bankconnector.api.dto.TransactionSyncResult;
import com.example.ezpay.shared.common.enums.FinancialDataProvider;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
public class PlaidSandboxConnector implements BankConnector {
    private final PlaidProperties plaidProperties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    public PlaidSandboxConnector(PlaidProperties plaidProperties, ObjectMapper objectMapper) {
        this.plaidProperties = plaidProperties;
        this.objectMapper = objectMapper;
    }

    @Override
    public FinancialDataProvider provider() {
        return FinancialDataProvider.PLAID_SANDBOX;
    }

    @Override
    public ConnectionLinkToken createLinkToken(Long userId) {
        ensureConfigured();

        com.fasterxml.jackson.databind.node.ObjectNode payload = objectMapper.createObjectNode();
        payload.put("client_id", plaidProperties.getClientId());
        payload.put("secret", plaidProperties.getSecret());
        payload.put("client_name", plaidProperties.getClientName());
        payload.put("language", plaidProperties.getLanguage());
        payload.putArray("country_codes").add(plaidProperties.getCountryCode());
        payload.putArray("products").add("transactions");
        payload.putObject("user").put("client_user_id", String.valueOf(userId));
        payload.putObject("transactions").put("days_requested", plaidProperties.getDaysRequested());

        if (plaidProperties.getWebhookUrl() != null && !plaidProperties.getWebhookUrl().isBlank()) {
            payload.put("webhook", plaidProperties.getWebhookUrl());
        }

        JsonNode response = post("/link/token/create", payload);

        return ConnectionLinkToken.builder()
                .provider(provider())
                .linkToken(requiredText(response, "link_token"))
                .expiresAt(optionalText(response, "expiration"))
                .build();
    }

    @Override
    public ConnectionExchangeResult exchangeConnection(ConnectionExchangeCommand command) {
        ensureConfigured();

        JsonNode response = post("/item/public_token/exchange", objectMapper.createObjectNode()
                .put("client_id", plaidProperties.getClientId())
                .put("secret", plaidProperties.getSecret())
                .put("public_token", command.getPublicToken())
        );

        return ConnectionExchangeResult.builder()
                .provider(provider())
                .connectionReference(requiredText(response, "item_id"))
                .providerAccountReference(requiredText(response, "item_id"))
                .accessToken(requiredText(response, "access_token"))
                .build();
    }

    @Override
    public TransactionSyncResult syncTransactions(TransactionSyncRequest request) {
        ensureConfigured();

        String initialCursor = request.getCursor();
        String currentCursor = initialCursor;
        boolean hasMore;
        List<NormalizedTransactionRecord> records = new ArrayList<>();

        do {
            JsonNode payload = objectMapper.createObjectNode()
                    .put("client_id", plaidProperties.getClientId())
                    .put("secret", plaidProperties.getSecret())
                    .put("access_token", request.getAccessToken())
                    .put("count", 100);

            if (currentCursor != null && !currentCursor.isBlank()) {
                ((com.fasterxml.jackson.databind.node.ObjectNode) payload).put("cursor", currentCursor);
            }

            JsonNode response = post("/transactions/sync", payload);
            hasMore = response.path("has_more").asBoolean(false);
            currentCursor = optionalText(response, "next_cursor");

            for (JsonNode node : iterable(response.path("added"))) {
                records.add(mapTransaction(node));
            }
            for (JsonNode node : iterable(response.path("modified"))) {
                records.add(mapTransaction(node));
            }
        } while (hasMore);

        return TransactionSyncResult.builder()
                .provider(provider())
                .nextCursor(currentCursor)
                .hasMore(false)
                .records(records)
                .build();
    }

    private NormalizedTransactionRecord mapTransaction(JsonNode node) {
        JsonNode categoryNode = node.path("personal_finance_category");
        String primaryCategory = optionalText(categoryNode, "primary");
        String detailedCategory = optionalText(categoryNode, "detailed");
        String merchantName = optionalText(node, "merchant_name");
        String description = optionalText(node, "name");
        String isoCurrencyCode = optionalText(node, "iso_currency_code");
        String accountId = optionalText(node, "account_id");
        boolean pending = node.path("pending").asBoolean(false);
        BigDecimal amount = node.hasNonNull("amount") ? node.get("amount").decimalValue() : BigDecimal.ZERO;

        return NormalizedTransactionRecord.builder()
                .provider(provider())
                .providerTransactionId(requiredText(node, "transaction_id"))
                .providerAccountId(accountId)
                .postedAt(parseDateTime(optionalText(node, "date")))
                .authorizedAt(parseDateTime(optionalText(node, "authorized_date")))
                .amount(amount)
                .currencyCode(isoCurrencyCode)
                .merchantName(merchantName)
                .description(description)
                .primaryCategory(primaryCategory)
                .detailedCategory(detailedCategory)
                .pending(pending)
                .direction(amount.signum() >= 0 ? "OUTFLOW" : "INFLOW")
                .rawPayload(writeJson(node))
                .build();
    }

    private JsonNode post(String path, JsonNode body) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(plaidProperties.getBaseUrl() + path))
                    .header("Content-Type", "application/json")
                    .header("PLAID-CLIENT-ID", plaidProperties.getClientId())
                    .header("PLAID-SECRET", plaidProperties.getSecret())
                    .POST(HttpRequest.BodyPublishers.ofString(writeJson(body)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400) {
                throw new IllegalArgumentException("Plaid API 호출 실패: " + response.body());
            }

            JsonNode json = objectMapper.readTree(response.body());
            if (json.hasNonNull("error_code")) {
                throw new IllegalArgumentException("Plaid API 오류: " + optionalText(json, "error_message"));
            }
            return json;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Plaid API 호출 중 오류가 발생했습니다.", e);
        } catch (IOException e) {
            throw new IllegalStateException("Plaid API 호출 중 오류가 발생했습니다.", e);
        }
    }

    private void ensureConfigured() {
        if (plaidProperties.getClientId() == null || plaidProperties.getClientId().isBlank()
                || plaidProperties.getSecret() == null || plaidProperties.getSecret().isBlank()) {
            throw new IllegalArgumentException("Plaid 설정이 비어 있습니다. PLAID_CLIENT_ID와 PLAID_SECRET을 확인하세요.");
        }
    }

    private String writeJson(JsonNode node) {
        try {
            return objectMapper.writeValueAsString(node);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("JSON 직렬화에 실패했습니다.", e);
        }
    }

    private String requiredText(JsonNode node, String fieldName) {
        String value = optionalText(node, fieldName);
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Plaid 응답에 필수 필드가 없습니다: " + fieldName);
        }
        return value;
    }

    private String optionalText(JsonNode node, String fieldName) {
        JsonNode child = node.path(fieldName);
        return child.isMissingNode() || child.isNull() ? null : child.asText();
    }

    private OffsetDateTime parseDateTime(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return OffsetDateTime.parse(value + "T00:00:00Z");
    }

    private Iterable<JsonNode> iterable(JsonNode node) {
        return () -> node == null ? List.<JsonNode>of().iterator() : node.elements();
    }
}
