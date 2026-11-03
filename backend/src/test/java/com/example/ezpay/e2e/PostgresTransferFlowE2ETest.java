package com.example.ezpay.e2e;

import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.test.annotation.DirtiesContext;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest(properties = {
        "spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect",
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
@Testcontainers(disabledWithoutDocker = true)
@DirtiesContext
class PostgresTransferFlowE2ETest extends TransferFlowE2ETest {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");
}
