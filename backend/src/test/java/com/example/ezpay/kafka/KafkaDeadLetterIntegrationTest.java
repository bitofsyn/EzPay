package com.example.ezpay.kafka;

import org.apache.kafka.clients.consumer.Consumer;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.test.EmbeddedKafkaBroker;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.kafka.test.utils.KafkaTestUtils;
import org.springframework.test.annotation.DirtiesContext;
import com.example.ezpay.modules.kafka.repository.FailedEventLogRepository;

import java.time.Duration;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:kafka-dlt-test;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.sql.init.mode=never",
        "spring.kafka.bootstrap-servers=${spring.embedded.kafka.brokers}",
        "spring.kafka.listener.auto-startup=true",
        "ezpay.kafka.enabled=true"
})
@EmbeddedKafka(partitions = 1, topics = {"transfer-events", "transfer-events.DLT"})
@DirtiesContext
class KafkaDeadLetterIntegrationTest {

    @Autowired EmbeddedKafkaBroker embeddedKafka;

    @Autowired
    @Qualifier("objectKafkaTemplate")
    KafkaTemplate<String, Object> kafkaTemplate;

    @Autowired FailedEventLogRepository failedEventLogRepository;

    @Test
    void malformedTransferEventIsPublishedToDeadLetterTopic() throws Exception {
        Map<String, Object> consumerProps = KafkaTestUtils.consumerProps(
                "dlt-integration-test", "true", embeddedKafka);
        Consumer<String, String> dltConsumer = new DefaultKafkaConsumerFactory<>(
                consumerProps, new StringDeserializer(), new StringDeserializer()).createConsumer();
        embeddedKafka.consumeFromAnEmbeddedTopic(dltConsumer, "transfer-events.DLT");

        try {
            kafkaTemplate.send("transfer-events", "malformed-transfer-event").get();

            ConsumerRecord<String, String> record = KafkaTestUtils.getSingleRecord(
                    dltConsumer, "transfer-events.DLT", Duration.ofSeconds(15));

            assertThat(record.value()).contains("malformed-transfer-event");
            assertThat(record.headers().lastHeader("kafka_dlt-exception-message")).isNotNull();

            long deadline = System.currentTimeMillis() + 5_000;
            while (failedEventLogRepository.count() == 0 && System.currentTimeMillis() < deadline) {
                Thread.sleep(50);
            }
            assertThat(failedEventLogRepository.findAll())
                    .singleElement()
                    .satisfies(log -> {
                        assertThat(log.getTopic()).isEqualTo("transfer-events.DLT");
                        assertThat(log.getPayload()).contains("malformed-transfer-event");
                        assertThat(log.getErrorMessage()).isNotBlank();
                    });
        } finally {
            dltConsumer.close();
        }
    }
}
