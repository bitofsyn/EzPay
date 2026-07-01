# EzPay Backend 구현 가이드

**작성일:** 2026-06-28  
**대상:** Spring Boot 백엔드 개발자  
**연동:** React 프론트엔드와의 API 통신

---

## 📋 목차

1. [개요](#개요)
2. [구현 순서](#구현-순서)
3. [환경 설정](#환경-설정)
4. [프로젝트 구조](#프로젝트-구조)
5. [단계별 구현](#단계별-구현)
6. [테스트 방법](#테스트-방법)

---

## 개요

EzPay 백엔드는 프론트엔드의 **Admin Dashboard**를 지원하기 위해 다음을 제공해야 합니다:

### 통신 방식
- **REST API**: 초기 데이터 조회 및 액션 처리
- **SSE (Server-Sent Events)**: 시스템 로그, 메트릭 실시간 스트림
- **WebSocket**: 거래 실시간 전달

### 데이터 소스
- **PostgreSQL**: 사용자, 거래, 로그 등 영구 저장
- **Kafka**: 실시간 이벤트 (거래, 위험 감지 등)
- **Redis**: 캐시 및 세션 관리

---

## 구현 순서

```
Week 1: 기본 REST API 구현
├─ Day 1-2: 환경 설정 + DB 스키마
├─ Day 3-4: User/Transaction REST API
└─ Day 5: Risk Transaction REST API

Week 2: 실시간 스트리밍
├─ Day 1-2: Kafka Consumer 설정
├─ Day 3-4: SSE 엔드포인트 구현
└─ Day 5: WebSocket 엔드포인트 구현

Week 3: 통합 및 테스트
├─ Day 1-2: 권한 관리 + 보안
├─ Day 3-4: 통합 테스트
└─ Day 5: 성능 최적화 + 모니터링
```

---

## 환경 설정

### 1. 의존성 추가 (pom.xml)

```xml
<dependencies>
    <!-- Web -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>

    <!-- WebSocket -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-websocket</artifactId>
    </dependency>

    <!-- Data JPA -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>

    <!-- PostgreSQL -->
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
        <version>42.6.0</version>
    </dependency>

    <!-- Kafka -->
    <dependency>
        <groupId>org.springframework.kafka</groupId>
        <artifactId>spring-kafka</artifactId>
    </dependency>

    <!-- Redis -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-redis</artifactId>
    </dependency>

    <!-- Validation -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>

    <!-- Security -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>

    <!-- JWT -->
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-api</artifactId>
        <version>0.11.5</version>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-impl</artifactId>
        <version>0.11.5</version>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-jackson</artifactId>
        <version>0.11.5</version>
        <scope>runtime</scope>
    </dependency>

    <!-- Lombok -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>

    <!-- Testing -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```

### 2. 애플리케이션 설정 (application.yml)

> 실제 구현 기준: 애플리케이션 이름은 `EzPay`, 포트는 **8081**이며, **context-path는 사용하지 않습니다** (엔드포인트는 루트 경로: 예 `/admin/stream/system-logs`).

```yaml
server:
  port: ${PORT:${SERVER_PORT:8081}}

spring:
  application:
    name: EzPay

  # Database
  datasource:
    url: ${DATABASE_URL:jdbc:postgresql://localhost:5432/ezpay}
    username: ${DB_USERNAME:postgres}
    password: ${DB_PASSWORD:password}
    driver-class-name: org.postgresql.Driver
    hikari:
      maximum-pool-size: 10
      connection-timeout: 30000

  jpa:
    database-platform: org.hibernate.dialect.PostgreSQLDialect
    hibernate:
      ddl-auto: validate   # prod 프로파일 기준 (local 프로파일은 update)
    properties:
      hibernate:
        jdbc:
          time_zone: Asia/Seoul

  # Kafka (기본 비활성화, EZPAY_KAFKA_ENABLED 로 제어)
  kafka:
    bootstrap-servers: ${SPRING_KAFKA_BOOTSTRAP_SERVERS:localhost:9092}
    listener:
      auto-startup: ${SPRING_KAFKA_LISTENER_AUTO_STARTUP:false}

# CORS 허용 오리진 (WebSocket/SSE 공용)
app:
  cors:
    allowed-origins: ${CORS_ALLOWED_ORIGINS:http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173}

ezpay:
  kafka:
    enabled: ${EZPAY_KAFKA_ENABLED:false}
  internal-api:
    secret-key: ${EZPAY_INTERNAL_API_SECRET_KEY:change-me-in-production}

logging:
  level:
    org.hibernate.SQL: INFO
    org.springframework.security: INFO
```

---

## 프로젝트 구조

> 실제 패키지 루트는 `com.example.ezpay` 이며, 모듈 기반 아키텍처를 따릅니다. Admin 컨트롤러는 `controller/admin/` 에, 실시간(SSE/WebSocket/스케줄러) 처리는 `modules/realtime/` 에, 도메인 로직은 `modules/*` 에 위치합니다.

```
src/main/java/com/example/ezpay/
├── EzPayApplication.java            # @SpringBootApplication + @EnableJpaAuditing
├── controller/
│   └── admin/
│       ├── AdminRiskTransactionController.java   # /admin/risk-transactions
│       ├── AdminDashboardController.java         # /admin/dashboard
│       ├── AdminStreamController.java            # /admin/stream (SSE)
│       ├── AdminSystemLogController.java         # /admin/system-logs
│       ├── AdminTransactionController.java
│       ├── AdminUserController.java
│       ├── AdminErrorLogController.java
│       └── AdminTransferLimitController.java
├── modules/
│   ├── realtime/
│   │   ├── EventBroadcaster.java                 # SSE 브로드캐스트 진입점
│   │   ├── sse/
│   │   │   └── SseEmitterRegistry.java           # SseEmitter 연결 레지스트리
│   │   ├── websocket/
│   │   │   ├── WebSocketConfig.java              # /ws/admin-events 등록
│   │   │   └── AdminWebSocketHandler.java        # TextWebSocketHandler
│   │   ├── scheduler/
│   │   │   └── DashboardStreamScheduler.java     # 주기적 대시보드 스트림
│   │   └── config/
│   │       └── SchedulingConfig.java             # @EnableScheduling
│   ├── risk/         # dto, entity, repository, service
│   ├── systemlog/    # dto, entity, repository, service
│   ├── kafka/        # entity, repository, service
│   ├── account/  auth/  analytics/  payment/
│   ├── notification/  errorlog/  admin/  user/  # 각 모듈: api / config / internal
```

---

## 단계별 구현

### STEP 1: 데이터베이스 스키마 설계

**[자세한 내용은 DATABASE_SCHEMA.md 참고](./DATABASE_SCHEMA.md)**

필수 테이블:
- `users` - 사용자 정보
- `transactions` - 거래 내역
- `risk_transactions` - AI 위험 거래 감지
- `system_logs` - 시스템 로그
- `admin_alerts` - 관리자 알림
- `admin_messages` - 관리자 메시지

### STEP 2: REST API 구현

**[자세한 내용은 API_SPECIFICATION.md 참고](./API_SPECIFICATION.md)**

#### 2.1 Risk Transaction API

```java
@RestController
@RequestMapping("/admin/risk-transactions")
@RequiredArgsConstructor
public class AdminRiskTransactionController {

  private final RiskTransactionService riskTransactionService;

  @GetMapping
  public ResponseEntity<ApiResponse<List<RiskTransactionDto>>> getRiskTransactions(
      @RequestParam(required = false) String filter
  ) {
    List<RiskTransactionDto> transactions = 
        riskTransactionService.getRiskTransactions(filter);
    return ResponseEntity.ok(ApiResponse.success("위험 거래 조회 성공", transactions));
  }

  @PostMapping("/{transactionId}/approve")
  public ResponseEntity<ApiResponse<RiskTransactionDto>> approveRiskTransaction(
      @PathVariable String transactionId
  ) {
    RiskTransactionDto result = 
        riskTransactionService.approveRiskTransaction(transactionId);
    return ResponseEntity.ok(ApiResponse.success("거래 승인 완료", result));
  }

  @PostMapping("/{transactionId}/block")
  public ResponseEntity<ApiResponse<RiskTransactionDto>> blockRiskTransaction(
      @PathVariable String transactionId
  ) {
    RiskTransactionDto result = 
        riskTransactionService.blockRiskTransaction(transactionId);
    return ResponseEntity.ok(ApiResponse.success("거래 차단 완료", result));
  }
}
```

#### 2.2 Dashboard API

```java
@RestController
@RequestMapping("/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

  private final DashboardService dashboardService;

  @GetMapping("/metrics")
  public ResponseEntity<ApiResponse<DashboardMetricsDto>> getDashboardMetrics() {
    DashboardMetricsDto metrics = dashboardService.getDashboardMetrics();
    return ResponseEntity.ok(ApiResponse.success("대시보드 메트릭 조회 성공", metrics));
  }

  @GetMapping("/tps-metrics")
  public ResponseEntity<ApiResponse<TPSMetricsDto>> getTPSMetrics() {
    TPSMetricsDto tpsMetrics = dashboardService.getTPSMetrics();
    return ResponseEntity.ok(ApiResponse.success("TPS 메트릭 조회 성공", tpsMetrics));
  }
}
```

### STEP 3: Kafka Consumer 구현

**[자세한 내용은 KAFKA_INTEGRATION.md 참고](./KAFKA_INTEGRATION.md)**

```java
@Component
@RequiredArgsConstructor
public class TransactionEventConsumer {

  private final EventBroadcaster eventBroadcaster;
  private final RedisTemplate<String, TransactionEvent> redisTemplate;
  private final TransactionRepository transactionRepository;

  @KafkaListener(
      topics = "transaction-events",
      groupId = "admin-dashboard-consumer",
      concurrency = "3"
  )
  public void consumeTransactionEvent(TransactionEvent event) {
    // 1. 필터링 (권한 기반)
    if (!shouldBroadcastEvent(event)) {
      return;
    }

    // 2. Redis 캐시에 저장
    redisTemplate.opsForList().leftPush("transactions:recent", event);
    redisTemplate.opsForList().trim("transactions:recent", 0, 99);

    // 3. DB에 저장
    transactionRepository.save(event);

    // 4. WebSocket/Redis Pub/Sub으로 브로드캐스트
    eventBroadcaster.broadcast("admin:dashboard:transactions", event);
  }

  private boolean shouldBroadcastEvent(TransactionEvent event) {
    // 관리자 권한 확인
    return true; // TODO: 실제 권한 체크 구현
  }
}
```

### STEP 4: SSE 엔드포인트 구현

**[자세한 내용은 WEBSOCKET_SSE_SETUP.md 참고](./WEBSOCKET_SSE_SETUP.md)**

```java
@RestController
@RequestMapping("/admin/stream")
@RequiredArgsConstructor
public class AdminStreamController {

  private final SystemLogService systemLogService;
  private final DashboardService dashboardService;

  @GetMapping("/system-logs")
  public SseEmitter streamSystemLogs() {
    SseEmitter emitter = new SseEmitter(300000L); // 5분 타임아웃

    new Thread(() -> {
      try {
        while (true) {
          SystemLogDto log = systemLogService.getNextLog();
          emitter.send(SseEmitter.event()
              .id(String.valueOf(log.getId()))
              .name("log")
              .data(log)
              .build());
          
          Thread.sleep(1000); // 1초 간격
        }
      } catch (IOException | InterruptedException e) {
        emitter.completeWithError(e);
      }
    }).start();

    return emitter;
  }

  @GetMapping("/tps-metrics")
  public SseEmitter streamTPSMetrics() {
    SseEmitter emitter = new SseEmitter(300000L);

    new Thread(() -> {
      try {
        while (true) {
          TPSMetricsDto metrics = dashboardService.getTPSMetrics();
          emitter.send(SseEmitter.event()
              .id(System.currentTimeMillis() + "")
              .name("metrics")
              .data(metrics)
              .build());
          
          Thread.sleep(3000); // 3초 간격
        }
      } catch (IOException | InterruptedException e) {
        emitter.completeWithError(e);
      }
    }).start();

    return emitter;
  }
}
```

### STEP 5: WebSocket 엔드포인트 구현

```java
// package com.example.ezpay.modules.realtime.websocket;
@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {

  private final AdminWebSocketHandler adminWebSocketHandler;

  // app.cors.allowed-origins 값을 주입받아 사용
  @Value("${app.cors.allowed-origins}")
  private String allowedOrigins;

  @Override
  public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
    registry.addHandler(adminWebSocketHandler, "/ws/admin-events")
        .setAllowedOrigins(allowedOrigins.split(","));
  }
}

@Component
public class AdminWebSocketHandler extends TextWebSocketHandler {

  private static final Set<WebSocketSession> sessions = ConcurrentHashMap.newKeySet();

  @Override
  public void afterConnectionEstablished(WebSocketSession session) throws Exception {
    sessions.add(session);
    logger.info("WebSocket connected: {}", session.getId());
  }

  @Override
  public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
    sessions.remove(session);
    logger.info("WebSocket disconnected: {}", session.getId());
  }

  public void broadcast(String topic, Object data) throws IOException {
    TextMessage message = new TextMessage(
        new ObjectMapper().writeValueAsString(Map.of("topic", topic, "data", data))
    );

    for (WebSocketSession session : sessions) {
      if (session.isOpen()) {
        session.sendMessage(message);
      }
    }
  }
}
```

### STEP 6: 권한 관리 구현

**[자세한 내용은 SECURITY.md 참고](./SECURITY.md)**

```java
@Component
@RequiredArgsConstructor
public class AdminAuthorizationFilter {

  private final JwtTokenProvider jwtTokenProvider;

  public void validateAdminAccess(HttpServletRequest request) {
    String token = extractToken(request);
    
    if (token == null || !jwtTokenProvider.validateToken(token)) {
      throw new UnauthorizedException("유효하지 않은 토큰");
    }

    String role = jwtTokenProvider.getRole(token);
    if (!"ADMIN".equals(role) && !"SUPER_ADMIN".equals(role)) {
      throw new UnauthorizedException("관리자 권한이 필요합니다");
    }
  }

  private String extractToken(HttpServletRequest request) {
    String header = request.getHeader("Authorization");
    if (header != null && header.startsWith("Bearer ")) {
      return header.substring(7);
    }
    return null;
  }
}
```

---

## 테스트 방법

### 1. REST API 테스트

```bash
# Risk Transaction 조회
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8081/admin/risk-transactions

# Risk Transaction 승인
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:8081/admin/risk-transactions/TX001/approve

# Dashboard 메트릭
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8081/admin/dashboard/metrics
```

### 2. SSE 테스트

```bash
# System Logs 스트림
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8081/admin/stream/system-logs

# TPS Metrics 스트림
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8081/admin/stream/tps-metrics

# 실시간 활동 스트림
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8081/admin/stream/activities
```

### 3. WebSocket 테스트

```bash
# WebSocket 연결
wscat -c ws://localhost:8081/ws/admin-events
```

### 4. Kafka Consumer 테스트

```bash
# 테스트 이벤트 발행
kafka-console-producer --broker-list localhost:9092 \
  --topic transaction-events \
  << 'EOF'
{"transactionId": "TX001", "amount": 50000, "status": "SUCCESS"}
EOF
```

---

## 체크리스트

### Week 1
- [ ] 의존성 추가
- [ ] application.yml 설정
- [ ] DB 스키마 생성
- [ ] Entity 클래스 작성
- [ ] Repository 인터페이스 작성
- [ ] REST API 컨트롤러 구현
- [ ] Service 레이어 구현
- [ ] 기본 테스트

### Week 2
- [ ] Kafka Consumer 구현
- [ ] EventBroadcaster 구현
- [ ] SSE 엔드포인트 구현
- [ ] WebSocket 핸들러 구현
- [ ] Redis Pub/Sub 통합
- [ ] 실시간 스트리밍 테스트

### Week 3
- [ ] JWT 토큰 검증
- [ ] 권한 기반 필터링
- [ ] Global Exception Handler
- [ ] 통합 테스트
- [ ] 성능 최적화
- [ ] 모니터링 설정

---

## 참고 문서

- [API_SPECIFICATION.md](./API_SPECIFICATION.md) - REST API 상세 스펙
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - DB 스키마 설계
- [KAFKA_INTEGRATION.md](./KAFKA_INTEGRATION.md) - Kafka 연동 가이드
- [WEBSOCKET_SSE_SETUP.md](./WEBSOCKET_SSE_SETUP.md) - WebSocket/SSE 설정
- [SECURITY.md](./SECURITY.md) - 보안 구현 가이드

---

**마지막 업데이트:** 2026-07-01  
**담당자:** Backend Architecture Team
