# Kafka 통합 가이드

**작성일:** 2026-06-28  
**대상:** 백엔드 개발자  
**Kafka 버전:** 3.0+

---

## 📋 목차

1. [Kafka 토픽 설정](#kafka-토픽-설정)
2. [Consumer 구현](#consumer-구현)
3. [Event Processing](#event-processing)
4. [Error Handling](#error-handling)
5. [모니터링](#모니터링)

---

## Kafka 토픽 설정

### 1. 토픽 생성

```bash
# transaction-events: 거래 이벤트
kafka-topics --create \
  --bootstrap-server localhost:9092 \
  --topic transaction-events \
  --partitions 9 \
  --replication-factor 3 \
  --config retention.ms=604800000 \
  --config compression.type=snappy

# risk-detection-events: 위험 거래 감지
kafka-topics --create \
  --bootstrap-server localhost:9092 \
  --topic risk-detection-events \
  --partitions 3 \
  --replication-factor 3

# system-log-events: 시스템 로그
kafka-topics --create \
  --bootstrap-server localhost:9092 \
  --topic system-log-events \
  --partitions 6 \
  --replication-factor 3

# metrics-events: 성능 메트릭
kafka-topics --create \
  --bootstrap-server localhost:9092 \
  --topic metrics-events \
  --partitions 3 \
  --replication-factor 3
```

### 2. 컨슈머 그룹 생성

```bash
kafka-consumer-groups --bootstrap-server localhost:9092 \
  --create \
  --group admin-dashboard-consumer
```

---

## Consumer 구현

### 1. TransactionEventConsumer

```java
@Component
@RequiredArgsConstructor
public class TransactionEventConsumer {

  private final EventBroadcaster eventBroadcaster;
  private final RedisTemplate<String, TransactionEvent> redisTemplate;
  private final TransactionRepository transactionRepository;
  private final SystemLogService systemLogService;

  @KafkaListener(
      topics = "transaction-events",
      groupId = "admin-dashboard-consumer",
      concurrency = "3",
      containerFactory = "kafkaListenerContainerFactory"
  )
  public void consumeTransactionEvent(
      @Payload TransactionEvent event,
      @Headers Map<String, Object> headers
  ) {
    try {
      // 1. Event 검증
      validateEvent(event);

      // 2. 필터링: 관리자 대시보드용 데이터만
      if (shouldBroadcastEvent(event)) {
        
        // 3. Redis 캐시에 저장 (최근 100건)
        cacheEvent(event);

        // 4. DB에 저장
        saveEvent(event);

        // 5. WebSocket/Redis Pub/Sub으로 브로드캐스트
        eventBroadcaster.broadcast("admin:dashboard:transactions", event);

        // 6. 시스템 로그 기록
        systemLogService.logTransaction(event, "PROCESSED");
      }

      // 7. 오프셋 수동 커밋
      acknowledgeMessage(headers);

    } catch (Exception e) {
      handleError(event, e);
    }
  }

  private void validateEvent(TransactionEvent event) {
    if (event.getTransactionId() == null || event.getAmount() <= 0) {
      throw new InvalidEventException("Invalid transaction event: " + event);
    }
  }

  private boolean shouldBroadcastEvent(TransactionEvent event) {
    // 관리자 대시보드는 모든 거래를 보여줌
    // 실제 운영 환경에서는 권한 기반 필터링 추가
    return true;
  }

  private void cacheEvent(TransactionEvent event) {
    redisTemplate.opsForList()
        .leftPush("transactions:recent", event);
    redisTemplate.opsForList()
        .trim("transactions:recent", 0, 99);
    
    // TTL 설정 (1시간)
    redisTemplate.expire("transactions:recent", 
        Duration.ofHours(1));
  }

  private void saveEvent(TransactionEvent event) {
    Transaction transaction = Transaction.from(event);
    transactionRepository.save(transaction);
  }

  private void acknowledgeMessage(Map<String, Object> headers) {
    // 수동 커밋 설정 시 오프셋 자동 관리
  }

  private void handleError(TransactionEvent event, Exception e) {
    logger.error("Failed to process transaction event: {}", 
        event.getTransactionId(), e);
    
    systemLogService.logError(
        "TRANSACTION_CONSUMER_ERROR",
        "Failed to process event: " + e.getMessage(),
        e.getStackTrace()
    );

    // 재시도 또는 DLQ (Dead Letter Queue)로 보냄
    // 구현 내용은 아래 Error Handling 섹션 참고
  }
}
```

### 2. RiskEventConsumer

```java
@Component
@RequiredArgsConstructor
public class RiskEventConsumer {

  private final EventBroadcaster eventBroadcaster;
  private final RiskTransactionRepository riskTransactionRepository;
  private final AdminAlertService adminAlertService;

  @KafkaListener(
      topics = "risk-detection-events",
      groupId = "admin-dashboard-consumer",
      concurrency = "2"
  )
  public void consumeRiskEvent(@Payload RiskDetectionEvent event) {
    try {
      // 위험 거래 저장
      RiskTransaction riskTx = RiskTransaction.from(event);
      riskTransactionRepository.save(riskTx);

      // 즉시 브로드캐스트 (심각도가 높으므로)
      eventBroadcaster.broadcast(
          "admin:dashboard:risk-transactions", 
          riskTx
      );

      // DANGER 레벨이면 알림 생성
      if ("DANGER".equals(event.getRiskLevel())) {
        adminAlertService.createAlert(
            "warning",
            "AI 위험 거래 감지",
            "고액 송금 " + event.getAmount() + "원이 위험거래로 감지되었습니다.",
            riskTx.getTransactionId()
        );
      }

    } catch (Exception e) {
      logger.error("Failed to process risk event", e);
    }
  }
}
```

### 3. SystemLogEventConsumer

```java
@Component
@RequiredArgsConstructor
public class SystemLogEventConsumer {

  private final SystemLogRepository systemLogRepository;
  private final EventBroadcaster eventBroadcaster;

  @KafkaListener(
      topics = "system-log-events",
      groupId = "admin-dashboard-consumer",
      concurrency = "3"
  )
  public void consumeLogEvent(@Payload SystemLogEvent event) {
    try {
      // DB에 저장
      SystemLog log = SystemLog.from(event);
      systemLogRepository.save(log);

      // SSE로 브로드캐스트 (로그 스트림)
      eventBroadcaster.broadcastToSSE("system-logs", log);

    } catch (Exception e) {
      logger.error("Failed to process log event", e);
    }
  }
}
```

---

## Event Processing

### 1. Event 모델 정의

```java
@Data
@AllArgsConstructor
@NoArgsConstructor
public class TransactionEvent {
  private String transactionId;
  private Long senderAccountId;
  private Long receiverAccountId;
  private BigDecimal amount;
  private String status;
  private LocalDateTime transactionDate;
  private Map<String, Object> metadata;
}

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RiskDetectionEvent {
  private String transactionId;
  private String riskLevel; // DANGER, CAUTION, SAFE
  private Double riskScore;
  private String reason;
  private BigDecimal amount;
  private LocalDateTime detectedAt;
}
```

### 2. Event Broadcaster

```java
@Component
@RequiredArgsConstructor
public class EventBroadcaster {

  private final SimpMessagingTemplate messagingTemplate;
  private final RedisTemplate<String, String> redisTemplate;
  private final ObjectMapper objectMapper;

  public void broadcast(String topic, Object data) {
    try {
      // 1. 현재 인스턴스의 WebSocket 클라이언트에게 전송
      messagingTemplate.convertAndSend(
          "/topic/" + topic,
          data
      );

      // 2. Redis Pub/Sub으로 다른 인스턴스에 전파
      String message = objectMapper.writeValueAsString(data);
      redisTemplate.convertAndSend("topic:" + topic, message);

    } catch (Exception e) {
      logger.error("Failed to broadcast event to topic: {}", topic, e);
    }
  }

  public void broadcastToSSE(String channel, Object data) {
    try {
      String message = objectMapper.writeValueAsString(data);
      redisTemplate.convertAndSend("sse:" + channel, message);
    } catch (Exception e) {
      logger.error("Failed to broadcast to SSE channel: {}", channel, e);
    }
  }
}
```

---

## Error Handling

### 1. Dead Letter Queue 설정

```java
@Configuration
public class KafkaErrorHandlingConfig {

  @Bean
  public NewTopic transactionEventsTopic() {
    return TopicBuilder.name("transaction-events")
        .partitions(9)
        .replicas(3)
        .config(TopicConfig.RETENTION_MS_CONFIG, "604800000") // 7일
        .build();
  }

  @Bean
  public NewTopic transactionEventsDlq() {
    return TopicBuilder.name("transaction-events-dlq")
        .partitions(1)
        .replicas(3)
        .config(TopicConfig.RETENTION_MS_CONFIG, "2592000000") // 30일
        .build();
  }

  // DLQ로 보내기 위한 Error Handler
  @Bean
  public KafkaTemplate<String, String> kafkaTemplate() {
    return new KafkaTemplate<>(producerFactory());
  }

  @Bean
  public ProducerFactory<String, String> producerFactory() {
    Map<String, Object> configProps = new HashMap<>();
    configProps.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
    configProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
    configProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
    return new DefaultProducerFactory<>(configProps);
  }
}
```

### 2. Error Handler 구현

```java
@Component
@RequiredArgsConstructor
public class TransactionEventConsumer {

  private final KafkaTemplate<String, String> kafkaTemplate;

  @KafkaListener(topics = "transaction-events", groupId = "admin-dashboard-consumer")
  public void consumeTransactionEvent(ConsumerRecord<String, TransactionEvent> record) {
    try {
      processEvent(record.value());
    } catch (Exception e) {
      handleError(record, e);
    }
  }

  @KafkaListener(topics = "transaction-events-dlq", groupId = "dlq-processor")
  public void processDLQ(ConsumerRecord<String, String> record) {
    logger.warn("Processing DLQ message: {}", record.value());
    
    // DLQ 메시지 저장 및 모니터링
    // 수동 재처리 또는 알림 발송
  }

  private void handleError(ConsumerRecord<String, TransactionEvent> record, Exception e) {
    logger.error("Error processing transaction event: {}", record.value(), e);

    try {
      // DLQ로 전송
      kafkaTemplate.send("transaction-events-dlq", record.value().toString());
    } catch (Exception sendError) {
      logger.error("Failed to send message to DLQ", sendError);
      // 데이터베이스에 저장 (최후의 수단)
      saveToErrorLog(record, e);
    }
  }

  private void saveToErrorLog(ConsumerRecord<String, TransactionEvent> record, Exception e) {
    ErrorLog errorLog = ErrorLog.builder()
        .topic(record.topic())
        .partition(record.partition())
        .offset(record.offset())
        .message(record.value().toString())
        .errorMessage(e.getMessage())
        .stackTrace(getStackTrace(e))
        .createdAt(LocalDateTime.now())
        .build();

    errorLogRepository.save(errorLog);
  }
}
```

---

## 모니터링

### 1. Consumer Lag 모니터링

```java
@Component
@RequiredArgsConstructor
public class KafkaMetricsCollector {

  private final ConsumerFactory<?> consumerFactory;
  private final MeterRegistry meterRegistry;

  @Scheduled(fixedRate = 30000) // 30초마다
  public void collectConsumerLag() {
    try (KafkaConsumer<String, String> consumer = 
         new KafkaConsumer<>(consumerFactory.getConfigurationProperties())) {
      
      consumer.subscribe(List.of(
          "transaction-events",
          "risk-detection-events",
          "system-log-events"
      ));

      Map<TopicPartition, Long> endOffsets = consumer.endOffsets(
          consumer.assignment()
      );

      endOffsets.forEach((tp, endOffset) -> {
        long committed = consumer.committed(tp).offset();
        long lag = endOffset - committed;

        meterRegistry.gauge(
            "kafka.consumer.lag",
            Map.of("topic", tp.topic(), "partition", String.valueOf(tp.partition())),
            lag
        );
      });

    } catch (Exception e) {
      logger.error("Failed to collect consumer lag metrics", e);
    }
  }
}
```

### 2. Prometheus 메트릭

```yaml
# application.yml
management:
  endpoints:
    web:
      exposure:
        include: health,metrics,prometheus
  metrics:
    tags:
      application: EzPay
    distribution:
      percentiles-histogram:
        kafka.consumer.record.lag: true
```

### 3. Alert 설정 (Alertmanager)

```yaml
# prometheus-rules.yml
groups:
  - name: kafka_alerts
    rules:
      - alert: HighConsumerLag
        expr: kafka_consumer_lag > 10000
        for: 5m
        annotations:
          summary: "High Kafka consumer lag detected"
          
      - alert: KafkaConsumerOffline
        expr: kafka_consumer_records_processing_total == 0
        for: 2m
        annotations:
          summary: "Kafka consumer appears to be offline"
```

---

## 성능 튜닝

### 1. Consumer 설정 최적화

```yaml
spring:
  kafka:
    consumer:
      max-poll-records: 500          # 한 번에 가져올 최대 레코드
      max-poll-interval-ms: 300000   # 5분
      session-timeout-ms: 30000      # 세션 타임아웃
      heartbeat-interval-ms: 10000   # 하트비트 간격
      fetch-min-bytes: 1024          # 최소 페치 크기
      fetch-max-wait-ms: 500         # 최대 대기 시간
    producer:
      acks: all                       # 모든 복제본에서 인정
      retries: 3
      batch-size: 16384
      linger-ms: 10
```

### 2. Concurrency 튜닝

```java
@KafkaListener(
    topics = "transaction-events",
    groupId = "admin-dashboard-consumer",
    concurrency = "3",  // 파티션 수의 30% 정도
    batch-listener = false
)
public void consume(TransactionEvent event) {
    // 처리
}
```

---

**마지막 업데이트:** 2026-06-28
