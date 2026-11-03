package com.example.ezpay.e2e;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:transfer-e2e;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.sql.init.mode=never",
        "spring.kafka.bootstrap-servers=${spring.embedded.kafka.brokers}",
        "spring.kafka.listener.auto-startup=true",
        "ezpay.kafka.enabled=true",
        "spring.mail.host=localhost",
        "spring.mail.port=1",
        "spring.mail.properties.mail.smtp.connectiontimeout=100",
        "spring.mail.properties.mail.smtp.timeout=100"
})
@AutoConfigureMockMvc
@EmbeddedKafka(partitions = 1, topics = {"transfer-events", "transfer-events.DLT"})
@DirtiesContext
class TransferFlowE2ETest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @Test
    void transfersMoneyThroughRealHttpSecurityDatabaseAndKafkaFlow() throws Exception {
        register("sender@ezpay.test", "송금자", "010-1111-1111");
        register("receiver@ezpay.test", "수취인", "010-2222-2222");

        String senderToken = login("sender@ezpay.test");
        String receiverToken = login("receiver@ezpay.test");
        long senderAccountId = createAccount(senderToken, "100000");
        long receiverAccountId = createAccount(receiverToken, "20000");

        MvcResult accepted = mockMvc.perform(post("/transaction/transfer")
                        .header("Authorization", bearer(senderToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "fromAccountId": %d,
                                  "toAccountId": %d,
                                  "amount": 30000,
                                  "memo": "통합 테스트 송금",
                                  "category": "TRANSFER"
                                }
                                """.formatted(senderAccountId, receiverAccountId)))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.message").value("TRANSFER_ACCEPTED"))
                .andReturn();

        String requestId = read(accepted).path("data").asText();
        JsonNode completedTransfer = awaitSuccessfulTransfer(senderToken, requestId, Duration.ofSeconds(15));

        assertThat(completedTransfer.path("requestId").asText()).isEqualTo(requestId);
        assertThat(completedTransfer.path("status").asText()).isEqualTo("SUCCESS");
        assertThat(completedTransfer.path("amount").decimalValue()).isEqualByComparingTo("30000");
        assertThat(accountBalance(senderToken)).isEqualByComparingTo("70000");
        assertThat(accountBalance(receiverToken)).isEqualByComparingTo("50000");
    }

    private void register(String email, String name, String phoneNumber) throws Exception {
        mockMvc.perform(post("/users/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "password": "Password1!",
                                  "name": "%s",
                                  "phoneNumber": "%s"
                                }
                                """.formatted(email, name, phoneNumber)))
                .andExpect(status().isCreated());
    }

    private String login(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/users/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "%s", "password": "Password1!"}
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andReturn();
        return read(result).path("data").path("token").asText();
    }

    private long createAccount(String token, String balance) throws Exception {
        MvcResult result = mockMvc.perform(post("/account")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"bankName": "EzPay", "balance": %s}
                                """.formatted(balance)))
                .andExpect(status().isOk())
                .andReturn();
        return read(result).path("data").path("accountId").asLong();
    }

    private JsonNode awaitSuccessfulTransfer(String token, String requestId, Duration timeout) throws Exception {
        long deadline = System.nanoTime() + timeout.toNanos();
        MvcResult lastResult = null;
        while (System.nanoTime() < deadline) {
            lastResult = mockMvc.perform(get("/transaction/transfer/{requestId}", requestId)
                            .header("Authorization", bearer(token)))
                    .andReturn();
            if (lastResult.getResponse().getStatus() == 200) {
                JsonNode transaction = read(lastResult).path("data");
                if ("SUCCESS".equals(transaction.path("status").asText())) {
                    return transaction;
                }
            }
            Thread.sleep(50);
        }
        throw new AssertionError("송금이 제한 시간 안에 완료되지 않았습니다. 마지막 응답="
                + (lastResult == null ? "없음" : lastResult.getResponse().getContentAsString()));
    }

    private java.math.BigDecimal accountBalance(String token) throws Exception {
        MvcResult result = mockMvc.perform(get("/account/me")
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andReturn();
        return read(result).path("data").get(0).path("balance").decimalValue();
    }

    private JsonNode read(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsByteArray());
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }
}
