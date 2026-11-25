package com.example.ezpay.e2e;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Kafka 가 없는 환경(공개 배포 기준, ezpay.kafka.enabled=false)에서 송금이 요청 안에서 바로 처리되는지 검증한다.
 * 과거에는 이 환경에서 송금 API 가 Kafka 접속 실패로 500 을 응답했다.
 */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:sync-transfer-e2e;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.sql.init.mode=never",
        "ezpay.kafka.enabled=false",
        "spring.mail.host=localhost",
        "spring.mail.port=1",
        "spring.mail.properties.mail.smtp.connectiontimeout=100",
        "spring.mail.properties.mail.smtp.timeout=100"
})
@AutoConfigureMockMvc
class SynchronousTransferFlowE2ETest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @Test
    void completesTransferWithinTheRequestWhenKafkaIsDisabled() throws Exception {
        register("sync-sender@ezpay.test", "동기송금자", "010-3333-3333");
        register("sync-receiver@ezpay.test", "동기수취인", "010-4444-4444");
        String senderToken = login("sync-sender@ezpay.test");
        String receiverToken = login("sync-receiver@ezpay.test");
        long senderAccountId = createAccount(senderToken, "100000");
        long receiverAccountId = createAccount(receiverToken, "20000");

        MvcResult accepted = mockMvc.perform(transfer(senderToken, senderAccountId, receiverAccountId, "30000"))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.message").value("TRANSFER_ACCEPTED"))
                .andReturn();
        String requestId = read(accepted).path("data").asText();

        // 응답 시점에 이미 처리가 끝나 있어야 한다(폴링 없이 바로 SUCCESS).
        JsonNode transaction = transferStatus(senderToken, requestId);
        assertThat(transaction.path("status").asText()).isEqualTo("SUCCESS");
        assertThat(accountBalance(senderToken)).isEqualByComparingTo("70000");
        assertThat(accountBalance(receiverToken)).isEqualByComparingTo("50000");
    }

    @Test
    void reportsFailureInsteadOfAcceptanceWhenTransferIsRejected() throws Exception {
        register("sync-poor@ezpay.test", "잔액부족", "010-5555-5555");
        register("sync-payee@ezpay.test", "수취인", "010-6666-6666");
        String senderToken = login("sync-poor@ezpay.test");
        String receiverToken = login("sync-payee@ezpay.test");
        long senderAccountId = createAccount(senderToken, "1000");
        long receiverAccountId = createAccount(receiverToken, "0");

        MvcResult rejected = mockMvc.perform(transfer(senderToken, senderAccountId, receiverAccountId, "5000"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("잔액 부족으로 송금할 수 없습니다."))
                .andReturn();
        String requestId = read(rejected).path("data").asText();

        // 실패 이력은 남고 잔액은 그대로여야 한다.
        assertThat(transferStatus(senderToken, requestId).path("status").asText()).isEqualTo("FAILED");
        assertThat(accountBalance(senderToken)).isEqualByComparingTo("1000");
        assertThat(accountBalance(receiverToken)).isEqualByComparingTo("0");
    }

    private org.springframework.test.web.servlet.RequestBuilder transfer(String token, long from, long to, String amount) {
        return post("/transaction/transfer")
                .header("Authorization", bearer(token))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"fromAccountId": %d, "toAccountId": %d, "amount": %s, "memo": "동기 송금", "category": "TRANSFER"}
                        """.formatted(from, to, amount));
    }

    private JsonNode transferStatus(String token, String requestId) throws Exception {
        MvcResult result = mockMvc.perform(get("/transaction/transfer/{requestId}", requestId)
                        .header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andReturn();
        return read(result).path("data");
    }

    private void register(String email, String name, String phoneNumber) throws Exception {
        mockMvc.perform(post("/users/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "%s", "password": "Password1!", "name": "%s", "phoneNumber": "%s"}
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

    private BigDecimal accountBalance(String token) throws Exception {
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
