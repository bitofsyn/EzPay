package com.example.ezpay.shared.messaging.config;

import com.example.ezpay.shared.messaging.events.TransferEvent;
import io.micrometer.core.instrument.MeterRegistry;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.TopicPartition;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.*;
import org.springframework.kafka.listener.ContainerProperties;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.kafka.support.serializer.ErrorHandlingDeserializer;
import org.springframework.kafka.support.serializer.JsonDeserializer;
import org.springframework.kafka.support.serializer.JsonSerializer;
import org.springframework.util.backoff.FixedBackOff;
import org.springframework.beans.factory.annotation.Value;

import java.util.HashMap;
import java.util.Map;

@Configuration
@ConditionalOnProperty(name = "ezpay.kafka.enabled", havingValue = "true", matchIfMissing = true)
@EnableKafka
public class KafkaConfig {
    @Value("${spring.kafka.bootstrap-servers:localhost:9092}")
    private String bootstrapServers;

    @Value("${spring.kafka.listener.auto-startup:false}")
    private boolean kafkaListenerAutoStartup;

    // 송금 토픽 파티션 수. TransactionConsumer 의 컨슈머 동시성(ezpay.kafka.transfer.concurrency)과
    // 함께 처리 병렬도를 결정한다. 파티션은 늘릴 수만 있고 줄일 수 없다.
    @Value("${ezpay.kafka.transfer.partitions:6}")
    private int transferPartitions;

    // send() 가 브로커 메타데이터를 기다리며 요청 스레드를 붙잡는 최대 시간. 기본값(60초)이면 브로커 장애 시
    // 송금 요청마다 1분씩 스레드가 묶이므로 짧게 제한해 빨리 실패시킨다.
    @Value("${ezpay.kafka.producer.max-block-ms:5000}")
    private long producerMaxBlockMs;

    public static final String TRANSFER_EVENTS_TOPIC = "transfer-events";
    public static final String TRANSFER_EVENTS_DLT = TRANSFER_EVENTS_TOPIC + ".DLT";

    public static final String TRANSACTION_EVENTS_TOPIC = "transaction-events";
    public static final String TRANSACTION_EVENTS_DLT = TRANSACTION_EVENTS_TOPIC + ".DLT";
    public static final String RISK_DETECTION_EVENTS_TOPIC = "risk-detection-events";
    public static final String RISK_DETECTION_EVENTS_DLT = RISK_DETECTION_EVENTS_TOPIC + ".DLT";
    public static final String SYSTEM_LOG_EVENTS_TOPIC = "system-log-events";
    public static final String SYSTEM_LOG_EVENTS_DLT = SYSTEM_LOG_EVENTS_TOPIC + ".DLT";

    // == Topic 정의 ==
    @Bean
    public NewTopic transferEventsTopic() {
        return new NewTopic(TRANSFER_EVENTS_TOPIC, transferPartitions, (short) 1);
    }

    // DLT 복구기는 원본과 같은 파티션 번호로 보내므로 파티션 수를 원본과 맞춘다.
    @Bean
    public NewTopic transferEventsDltTopic() {
        return new NewTopic(TRANSFER_EVENTS_DLT, transferPartitions, (short) 1);
    }

    @Bean
    public NewTopic transactionEventsTopic() {
        return new NewTopic(TRANSACTION_EVENTS_TOPIC, 1, (short) 1);
    }

    @Bean
    public NewTopic riskDetectionEventsTopic() {
        return new NewTopic(RISK_DETECTION_EVENTS_TOPIC, 1, (short) 1);
    }

    @Bean
    public NewTopic systemLogEventsTopic() {
        return new NewTopic(SYSTEM_LOG_EVENTS_TOPIC, 1, (short) 1);
    }

    // 역직렬화 실패/처리 실패 메시지를 흘려보낼 DLT 목적지 토픽
    @Bean
    public NewTopic transactionEventsDltTopic() {
        return new NewTopic(TRANSACTION_EVENTS_DLT, 1, (short) 1);
    }

    @Bean
    public NewTopic riskDetectionEventsDltTopic() {
        return new NewTopic(RISK_DETECTION_EVENTS_DLT, 1, (short) 1);
    }

    @Bean
    public NewTopic systemLogEventsDltTopic() {
        return new NewTopic(SYSTEM_LOG_EVENTS_DLT, 1, (short) 1);
    }


    /*
        ProducerFactory 설정 (KafkaTemplate을 위해 필수)
     */
    @Bean
    public ProducerFactory<String, TransferEvent> producerFactory(MeterRegistry meterRegistry) {
        Map<String, Object> configProps = new HashMap<>();
        configProps.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        configProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        configProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        // 트랜잭셔널 프로듀서 대신 멱등 프로듀서를 쓴다.
        // - 송금 발행은 메시지 1건이라 Kafka 트랜잭션이 보장해 줄 원자성이 없고, DB 와 묶이지도 않는다.
        // - 트랜잭셔널 모드는 동시 요청마다 프로듀서를 새로 만들고 InitProducerId/EndTxn 왕복을 더해
        //   지속 고동시성에서 브로커 타임아웃·프로듀서 폭증으로 붕괴했다.
        // - 중복 발행은 브로커(idempotence)와 컨슈머(requestId 유니크 제약 + 조회 가드)가 막는다.
        configProps.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);
        configProps.put(ProducerConfig.ACKS_CONFIG, "all");
        configProps.put(ProducerConfig.LINGER_MS_CONFIG, 5);
        configProps.put(ProducerConfig.MAX_BLOCK_MS_CONFIG, producerMaxBlockMs);

        DefaultKafkaProducerFactory<String, TransferEvent> factory = new DefaultKafkaProducerFactory<>(configProps);
        // 커스텀 팩토리는 Boot 자동 구성의 Micrometer 바인딩을 받지 못하므로 직접 등록한다. (kafka_producer_*)
        factory.addListener(new MicrometerProducerListener<>(meterRegistry));
        return factory;
    }


    /*
        KafkaTemplate (Kafka 메시지를 보내기 위해 필요)
     */
    @Bean
    public KafkaTemplate<String, TransferEvent> kafkaTemplate(ProducerFactory<String, TransferEvent> producerFactory) {
        return new KafkaTemplate<>(producerFactory);
    }

    /*
        ProducerFactory for Object type (DLT용)
     */
    @Bean
    public ProducerFactory<String, Object> objectProducerFactory(MeterRegistry meterRegistry) {
        Map<String, Object> configProps = new HashMap<>();
        configProps.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        configProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        configProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        DefaultKafkaProducerFactory<String, Object> factory = new DefaultKafkaProducerFactory<>(configProps);
        factory.addListener(new MicrometerProducerListener<>(meterRegistry));
        return factory;
    }

    /*
        KafkaTemplate for Object type (DLT 및 에러 핸들링용)
     */
    @Bean
    public KafkaTemplate<String, Object> objectKafkaTemplate(ProducerFactory<String, Object> objectProducerFactory) {
        return new KafkaTemplate<>(objectProducerFactory);
    }

    /*
        ConsumerFactory 설정 (Kafka Listener를 위해 필요)
     */
    @Bean
    public ConsumerFactory<String, Object> consumerFactory(MeterRegistry meterRegistry) {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "ezpay-group");
        // 커밋된 오프셋이 없는 새 컨슈머 그룹이 파티션을 배정받기 전에 발행된 송금을 건너뛰지 않도록 처음부터 읽는다.
        // (기본값 latest 에서는 배포 직후·파티션 증설 직후 들어온 메시지가 유실됐다)
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        // ErrorHandlingDeserializer로 감싸 역직렬화 실패(헤더 없는/깨진 메시지)가
        // 컨슈머를 무한 재시도로 막지 않고 에러 핸들러(→ DLT)로 흘러가도록 한다.
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, ErrorHandlingDeserializer.class);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, ErrorHandlingDeserializer.class);
        props.put(ErrorHandlingDeserializer.KEY_DESERIALIZER_CLASS, StringDeserializer.class);
        props.put(ErrorHandlingDeserializer.VALUE_DESERIALIZER_CLASS, JsonDeserializer.class);
        props.put(JsonDeserializer.TRUSTED_PACKAGES, "*");

        DefaultKafkaConsumerFactory<String, Object> factory = new DefaultKafkaConsumerFactory<>(props);
        // 컨슈머 lag·fetch 지표(kafka_consumer_*)를 Micrometer로 내보낸다.
        factory.addListener(new MicrometerConsumerListener<>(meterRegistry));
        return factory;
    }

    /*
        KafkaListener 설정 (Consumer가 메시지를 받기 위해 필요)
     */
    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, TransferEvent> kafkaListenerContainerFactory(
            ConsumerFactory<String, Object> consumerFactory,
            KafkaTemplate<String, Object> kafkaTemplate) {
        ConcurrentKafkaListenerContainerFactory<String, TransferEvent> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory);
        factory.setAutoStartup(kafkaListenerAutoStartup);

        // AckMode를 MANUAL로 설정 (자동 커밋 비활성화)
        factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.MANUAL);

        // DLT 설정
        DeadLetterPublishingRecoverer recoverer = new DeadLetterPublishingRecoverer(kafkaTemplate,
                (record, ex) -> new TopicPartition(record.topic() + ".DLT", record.partition()));

        // 1초 간격으로 2번 재시도 후 DLT로 전송하는 에러 핸들러
        DefaultErrorHandler errorHandler = new DefaultErrorHandler(recoverer, new FixedBackOff(1000L, 2));
        factory.setCommonErrorHandler(errorHandler);

        return factory;
    }
}
