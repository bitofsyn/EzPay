package com.example.ezpay.kafka;

import com.example.ezpay.model.kafka.TransferEvent;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.*;
import org.springframework.kafka.listener.ContainerProperties;
import org.springframework.kafka.support.serializer.JsonDeserializer;
import org.springframework.kafka.support.serializer.JsonSerializer;

import java.util.HashMap;
import java.util.Map;

@EnableKafka
@Configuration
public class KafkaConfig {
    private static final String BOOTSTRAP_SERVERS = "kafka:9092";

    /**
     * ✅ ProducerFactory 설정 (KafkaTemplate을 위해 필수)
     */
    @Bean
    public ProducerFactory<String, TransferEvent> producerFactory() {
        Map<String, Object> configProps = new HashMap<>();
        configProps.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, BOOTSTRAP_SERVERS);
        configProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        configProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        configProps.put(ProducerConfig.TRANSACTIONAL_ID_CONFIG, "tx-ezpay-"); // ✅ 트랜잭션 설정

        DefaultKafkaProducerFactory<String, TransferEvent> factory = new DefaultKafkaProducerFactory<>(configProps);
        factory.setTransactionIdPrefix("tx-ezpay-");
        return factory;
    }


    /**
     * ✅ KafkaTemplate (Kafka 메시지를 보내기 위해 필요)
     */
    @Bean
    public KafkaTemplate<String, TransferEvent> kafkaTemplate(ProducerFactory<String, TransferEvent> producerFactory) {
        return new KafkaTemplate<>(producerFactory);
    }

    /**
     * ✅ ConsumerFactory 설정 (Kafka Listener를 위해 필요)
     */
    @Bean
    public ConsumerFactory<String, TransferEvent> consumerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, BOOTSTRAP_SERVERS);
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "ezpay-group");
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);
        props.put(JsonDeserializer.TRUSTED_PACKAGES, "*");

        return new DefaultKafkaConsumerFactory<>(props);
    }

    /**
     * ✅ KafkaListener 설정 (Consumer가 메시지를 받기 위해 필요)
     */
    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, TransferEvent> kafkaListenerContainerFactory(
            ConsumerFactory<String, TransferEvent> consumerFactory) {
        ConcurrentKafkaListenerContainerFactory<String, TransferEvent> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory);

        // ✅ AckMode를 MANUAL로 설정 (자동 커밋 비활성화)
        factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.MANUAL);

        return factory;
    }
}
