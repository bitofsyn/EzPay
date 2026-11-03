package com.example.ezpay.e2e;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:password-reset-e2e;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.sql.init.mode=never",
        "ezpay.kafka.enabled=false",
        "management.health.mail.enabled=false",
        "app.frontend-base-url=https://ezpay.test"
})
@AutoConfigureMockMvc
class PasswordResetFlowE2ETest {

    private static final Pattern TOKEN_PATTERN = Pattern.compile("[?&]token=([^\\s&]+)");

    @Autowired MockMvc mockMvc;

    @MockitoBean JavaMailSender mailSender;

    @Test
    void resetsPasswordFromEmailedLinkAndLogsInWithNewPassword() throws Exception {
        register();

        mockMvc.perform(post("/password-reset/request")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"reset-user@ezpay.test\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").doesNotExist());

        ArgumentCaptor<SimpleMailMessage> message = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(message.capture());
        String token = extractToken(message.getValue().getText());

        mockMvc.perform(get("/password-reset/validate").param("token", token))
                .andExpect(status().isOk());

        mockMvc.perform(put("/password-reset/reset-password")
                        .header("Authorization", "Bearer " + token)
                        .param("newPassword", "ChangedPassword2!"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/users/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"reset-user@ezpay.test","password":"ChangedPassword2!"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.token").isNotEmpty());

        mockMvc.perform(get("/password-reset/validate").param("token", token))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void unknownEmailReturnsSameSuccessShapeWithoutSendingMail() throws Exception {
        mockMvc.perform(post("/password-reset/request")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"missing@ezpay.test\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").doesNotExist());

        org.mockito.Mockito.verify(mailSender, org.mockito.Mockito.never()).send(any(SimpleMailMessage.class));
    }

    private void register() throws Exception {
        mockMvc.perform(post("/users/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email":"reset-user@ezpay.test",
                                  "password":"Password1!",
                                  "name":"재설정 사용자",
                                  "phoneNumber":"010-3333-3333"
                                }
                                """))
                .andExpect(status().isCreated());
    }

    private String extractToken(String body) {
        Matcher matcher = TOKEN_PATTERN.matcher(body == null ? "" : body);
        assertThat(matcher.find()).as("재설정 메일에 token 쿼리가 있어야 한다").isTrue();
        return matcher.group(1);
    }
}
