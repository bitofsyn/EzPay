package com.example.ezpay.shared.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 별도 설정이 없는 기본 상태(= 공개 배포 환경)에서는 메트릭 엔드포인트가 노출되지 않아야 한다.
 */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:actuator-default-test;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.sql.init.mode=never",
        "ezpay.kafka.enabled=false"
})
@AutoConfigureMockMvc
class ActuatorDefaultExposureIntegrationTest {

    @Autowired MockMvc mockMvc;

    @Test
    void healthIsExposedByDefault() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk());
    }

    @Test
    void prometheusEndpointIsNotExposedByDefault() throws Exception {
        // 비노출 경로는 앱의 전역 예외 처리 때문에 404 가 아닌 오류 상태로 응답하므로,
        // 상태 코드 대신 "성공 응답이 아니며 메트릭 본문이 없다"는 사실을 검증한다.
        var response = mockMvc.perform(get("/actuator/prometheus")).andReturn().getResponse();
        org.junit.jupiter.api.Assertions.assertNotEquals(200, response.getStatus());
        org.junit.jupiter.api.Assertions.assertFalse(
                response.getContentAsString().contains("jvm_memory_used_bytes"));
    }
}
