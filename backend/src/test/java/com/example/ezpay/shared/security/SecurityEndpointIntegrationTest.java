package com.example.ezpay.shared.security;

import com.example.ezpay.modules.realtime.sse.SseEmitterRegistry;
import org.junit.jupiter.api.Test;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.lang.reflect.Field;
import java.util.Map;
import java.util.Set;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.test.context.TestSecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.asyncDispatch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:security-test;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.sql.init.mode=never",
        "ezpay.kafka.enabled=false",
        // 모니터링 스택이 붙는 환경과 동일하게 스크레이프 엔드포인트를 연 상태로 검증한다.
        "management.endpoints.web.exposure.include=health,info,prometheus"
})
@AutoConfigureMockMvc
class SecurityEndpointIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired SseEmitterRegistry sseEmitterRegistry;

    @Test
    void signupIsPublicButStillValidatesRequestBody() throws Exception {
        mockMvc.perform(post("/users/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void userProfileRequiresAuthentication() throws Exception {
        mockMvc.perform(get("/users/me"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "USER")
    void regularUserCannotAccessAdminApi() throws Exception {
        mockMvc.perform(get("/admin/dashboard/metrics"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminCanAccessAdminApi() throws Exception {
        mockMvc.perform(get("/admin/dashboard/metrics"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "USER")
    void regularUserCannotOpenAdminStream() throws Exception {
        mockMvc.perform(get("/admin/stream/tps-metrics"))
                .andExpect(status().isForbidden());
    }

    @Test
    void anonymousCannotOpenAdminStream() throws Exception {
        mockMvc.perform(get("/admin/stream/tps-metrics"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminStreamAsyncRedispatchIsNotDeniedWithoutAuthentication() throws Exception {
        MvcResult started = mockMvc.perform(get("/admin/stream/tps-metrics"))
                .andExpect(request().asyncStarted())
                .andReturn();

        // 스트림 종료(complete)로 비동기 결과를 확정해 ASYNC 재디스패치가 가능하게 한다.
        Field field = SseEmitterRegistry.class.getDeclaredField("channelEmitters");
        field.setAccessible(true);
        @SuppressWarnings("unchecked")
        Map<String, Set<SseEmitter>> channels = (Map<String, Set<SseEmitter>>) field.get(sseEmitterRegistry);
        channels.get("tps-metrics").forEach(SseEmitter::complete);

        // 실제 서버의 ASYNC 재디스패치에서는 JwtAuthenticationFilter가 건너뛰어져 인증 정보가 없다.
        SecurityContextHolder.clearContext();
        TestSecurityContextHolder.clearContext();

        // 인가가 거부되면 ExceptionTranslationFilter가 403으로 바꾼다(운영에서는 /error 5xx로 기록됨).
        mockMvc.perform(asyncDispatch(started))
                .andExpect(status().isOk());
    }

    @Test
    void prometheusScrapeEndpointIsPublicAndExposesLatencyHistogram() throws Exception {
        // 히스토그램 버킷은 최소 1건의 요청이 기록된 뒤에 노출된다.
        mockMvc.perform(get("/health")).andExpect(status().isOk());

        mockMvc.perform(get("/actuator/prometheus"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("jvm_memory_used_bytes")))
                .andExpect(content().string(containsString("hikaricp_connections_active")));
    }

    @Test
    void healthEndpointHidesDetailsFromAnonymousUsers() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(jsonPath("$.status").exists())
                .andExpect(jsonPath("$.components").doesNotExist());
    }

    @Test
    void otherActuatorEndpointsAreNotPublic() throws Exception {
        mockMvc.perform(get("/actuator/metrics"))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/actuator/env"))
                .andExpect(status().isForbidden());
    }
}
