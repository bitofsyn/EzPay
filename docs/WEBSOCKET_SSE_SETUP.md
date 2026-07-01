# WebSocket & SSE 설정 가이드

**작성일:** 2026-06-28  
**프레임워크:** Spring WebSocket + Spring MVC

---

## 📋 목차

1. [WebSocket 설정](#websocket-설정)
2. [SSE (Server-Sent Events) 설정](#sse-서버전송이벤트-설정)
3. [프론트엔드 연동](#프론트엔드-연동)
4. [성능 최적화](#성능-최적화)

---

## WebSocket 설정

### 1. WebSocket 설정 클래스

```java
@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

  private final TransactionStreamHandler transactionStreamHandler;
  private final RiskTransactionStreamHandler riskTransactionStreamHandler;

  @Override
  public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
    registry
        .addHandler(transactionStreamHandler, "/ws/admin-events")
        .setAllowedOrigins(
            "http://localhost:3000",      // 개발
            "http://localhost:5173",      // Vite 개발
            "https://app.ezpay.com"       // 운영
        )
        .withSockJS()                     // Fallback: SockJS 사용
        .setClientLibraryUrl("https://cdn.jsdelivr.net/npm/sockjs-client@1.6.1/dist/sockjs.min.js");
  }
}
```

### 2. Transaction Stream Handler

```java
@Component
public class TransactionStreamHandler extends TextWebSocketHandler {

  private static final Logger logger = LoggerFactory.getLogger(TransactionStreamHandler.class);
  private final ConnectionManager connectionManager;

  private static final Set<WebSocketSession> sessions = ConcurrentHashMap.newKeySet();

  @Override
  public void afterConnectionEstablished(WebSocketSession session) throws Exception {
    sessions.add(session);
    connectionManager.registerConnection(session);
    
    logger.info("WebSocket connected: {} (Total: {})", 
        session.getId(), sessions.size());

    // 클라이언트에게 연결 확인 메시지 전송
    sendMessage(session, Map.of(
        "event", "connected",
        "message", "Successfully connected to admin events stream",
        "timestamp", LocalDateTime.now()
    ));
  }

  @Override
  public void handleMessage(WebSocketSession session, WebSocketMessage<?> message) throws Exception {
    try {
      String payload = (String) message.getPayload();
      Map<String, Object> request = new ObjectMapper()
          .readValue(payload, new TypeReference<Map<String, Object>>() {});

      String action = (String) request.get("action");

      switch (action) {
        case "subscribe":
          String topic = (String) request.get("topic");
          connectionManager.subscribe(session, topic);
          break;

        case "unsubscribe":
          String unsubTopic = (String) request.get("topic");
          connectionManager.unsubscribe(session, unsubTopic);
          break;

        case "ping":
          sendMessage(session, Map.of("event", "pong"));
          break;

        default:
          logger.warn("Unknown action: {}", action);
      }

    } catch (Exception e) {
      logger.error("Error handling message", e);
      sendMessage(session, Map.of(
          "event", "error",
          "message", "Invalid message format"
      ));
    }
  }

  @Override
  public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
    sessions.remove(session);
    connectionManager.unregisterConnection(session);
    
    logger.info("WebSocket disconnected: {} - {} (Total: {})", 
        session.getId(), status.getReason(), sessions.size());
  }

  @Override
  public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
    logger.error("WebSocket error for session {}: {}", 
        session.getId(), exception.getMessage());
  }

  public void broadcast(String topic, Object data) throws IOException {
    Map<String, Object> message = Map.of(
        "topic", topic,
        "data", data,
        "timestamp", LocalDateTime.now()
    );

    String messageStr = new ObjectMapper().writeValueAsString(message);
    TextMessage textMessage = new TextMessage(messageStr);

    for (WebSocketSession session : sessions) {
      if (session.isOpen() && 
          connectionManager.isSubscribedTo(session, topic)) {
        try {
          session.sendMessage(textMessage);
        } catch (IOException e) {
          logger.error("Failed to send message to session {}", session.getId(), e);
        }
      }
    }
  }

  private void sendMessage(WebSocketSession session, Map<String, Object> data) throws IOException {
    String message = new ObjectMapper().writeValueAsString(data);
    session.sendMessage(new TextMessage(message));
  }
}
```

### 3. Connection Manager

```java
@Component
public class ConnectionManager {

  private final Map<String, Set<String>> userSubscriptions = 
      new ConcurrentHashMap<>();
  
  private final Map<WebSocketSession, String> sessionToUser = 
      new ConcurrentHashMap<>();

  public void registerConnection(WebSocketSession session) {
    String userId = extractUserId(session);
    sessionToUser.put(session, userId);
    
    userSubscriptions.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet());
  }

  public void unregisterConnection(WebSocketSession session) {
    String userId = sessionToUser.remove(session);
    if (userId != null) {
      Set<String> subscriptions = userSubscriptions.get(userId);
      if (subscriptions != null) {
        subscriptions.clear();
      }
    }
  }

  public void subscribe(WebSocketSession session, String topic) {
    String userId = sessionToUser.get(session);
    if (userId != null) {
      userSubscriptions.get(userId).add(topic);
      logger.info("User {} subscribed to topic: {}", userId, topic);
    }
  }

  public void unsubscribe(WebSocketSession session, String topic) {
    String userId = sessionToUser.get(session);
    if (userId != null) {
      userSubscriptions.get(userId).remove(topic);
      logger.info("User {} unsubscribed from topic: {}", userId, topic);
    }
  }

  public boolean isSubscribedTo(WebSocketSession session, String topic) {
    String userId = sessionToUser.get(session);
    return userId != null && 
           userSubscriptions.getOrDefault(userId, Set.of()).contains(topic);
  }

  private String extractUserId(WebSocketSession session) {
    // JWT 토큰 또는 세션에서 사용자 ID 추출
    HttpHeaders headers = session.getHandshakeHeaders();
    String authHeader = headers.getFirst("Authorization");
    
    if (authHeader != null && authHeader.startsWith("Bearer ")) {
      return JwtTokenProvider.getUserIdFromToken(authHeader.substring(7));
    }

    return "anonymous";
  }
}
```

---

## SSE (Server-Sent Events) 설정

### 1. SSE Controller

```java
@RestController
@RequestMapping("/admin/stream")
@RequiredArgsConstructor
public class StreamController {

  private final SystemLogService systemLogService;
  private final MetricsService metricsService;
  private final SseEmitterRepository sseEmitterRepository;

  @GetMapping("/system-logs")
  public SseEmitter streamSystemLogs(
      @RequestHeader(name = "Authorization") String token
  ) {
    String userId = extractUserIdFromToken(token);
    SseEmitter emitter = new SseEmitter(300000L); // 5분 타임아웃

    sseEmitterRepository.save(userId, "system-logs", emitter);

    emitter.onCompletion(() -> 
        sseEmitterRepository.removeEmitter(userId, "system-logs", emitter));
    emitter.onTimeout(() -> 
        sseEmitterRepository.removeEmitter(userId, "system-logs", emitter));

    // 비동기로 스트림 시작
    streamSystemLogsAsync(emitter);

    return emitter;
  }

  @GetMapping("/tps-metrics")
  public SseEmitter streamTPSMetrics(
      @RequestHeader(name = "Authorization") String token
  ) {
    String userId = extractUserIdFromToken(token);
    SseEmitter emitter = new SseEmitter(300000L);

    sseEmitterRepository.save(userId, "tps-metrics", emitter);

    emitter.onCompletion(() -> 
        sseEmitterRepository.removeEmitter(userId, "tps-metrics", emitter));
    emitter.onTimeout(() -> 
        sseEmitterRepository.removeEmitter(userId, "tps-metrics", emitter));

    streamTPSMetricsAsync(emitter);

    return emitter;
  }

  @GetMapping("/activities")
  public SseEmitter streamActivities(
      @RequestHeader(name = "Authorization") String token
  ) {
    String userId = extractUserIdFromToken(token);
    SseEmitter emitter = new SseEmitter(300000L);

    sseEmitterRepository.save(userId, "activities", emitter);

    streamActivitiesAsync(emitter);

    return emitter;
  }

  @Async
  private void streamSystemLogsAsync(SseEmitter emitter) {
    try {
      // 초기 메시지
      emitter.send(SseEmitter.event()
          .id("0")
          .name("connect")
          .data("Connected to system logs stream")
          .build());

      // 로그를 지속적으로 전송
      while (true) {
        SystemLogDto log = systemLogService.getNextLog();
        if (log != null) {
          emitter.send(SseEmitter.event()
              .id(String.valueOf(log.getId()))
              .name("log")
              .data(log)
              .build());
        }

        Thread.sleep(1000); // 1초 간격
      }

    } catch (IOException | InterruptedException e) {
      logger.error("SSE error for system-logs stream", e);
      try {
        emitter.completeWithError(e);
      } catch (IOException ioe) {
        logger.error("Failed to complete emitter with error", ioe);
      }
    }
  }

  @Async
  private void streamTPSMetricsAsync(SseEmitter emitter) {
    try {
      while (true) {
        TPSMetricsDto metrics = metricsService.getCurrentTPSMetrics();
        
        emitter.send(SseEmitter.event()
            .id(System.currentTimeMillis() + "")
            .name("metrics")
            .data(metrics)
            .build());

        Thread.sleep(3000); // 3초 간격
      }

    } catch (IOException | InterruptedException e) {
      logger.error("SSE error for tps-metrics stream", e);
      try {
        emitter.completeWithError(e);
      } catch (IOException ioe) {
        logger.error("Failed to complete emitter with error", ioe);
      }
    }
  }

  @Async
  private void streamActivitiesAsync(SseEmitter emitter) {
    try {
      while (true) {
        ActivityDto activity = systemLogService.getNextActivity();
        if (activity != null) {
          emitter.send(SseEmitter.event()
              .id(activity.getId() + "")
              .name("activity")
              .data(activity)
              .build());
        }

        Thread.sleep(2000); // 2초 간격
      }

    } catch (IOException | InterruptedException e) {
      logger.error("SSE error for activities stream", e);
      try {
        emitter.completeWithError(e);
      } catch (IOException ioe) {
        logger.error("Failed to complete emitter with error", ioe);
      }
    }
  }

  private String extractUserIdFromToken(String token) {
    if (token != null && token.startsWith("Bearer ")) {
      return JwtTokenProvider.getUserIdFromToken(token.substring(7));
    }
    throw new UnauthorizedException("Invalid token");
  }
}
```

### 2. SSE Emitter Repository

```java
@Component
public class SseEmitterRepository {

  private final Map<String, Map<String, Set<SseEmitter>>> emitters = 
      new ConcurrentHashMap<>();

  public void save(String userId, String channel, SseEmitter emitter) {
    emitters
        .computeIfAbsent(userId, k -> new ConcurrentHashMap<>())
        .computeIfAbsent(channel, k -> ConcurrentHashMap.newKeySet())
        .add(emitter);
  }

  public void removeEmitter(String userId, String channel, SseEmitter emitter) {
    Map<String, Set<SseEmitter>> userEmitters = emitters.get(userId);
    if (userEmitters != null) {
      Set<SseEmitter> channelEmitters = userEmitters.get(channel);
      if (channelEmitters != null) {
        channelEmitters.remove(emitter);
      }
    }
  }

  public void broadcast(String channel, Object data) throws IOException {
    String json = new ObjectMapper().writeValueAsString(data);

    for (Map<String, Set<SseEmitter>> userEmitters : emitters.values()) {
      Set<SseEmitter> channelEmitters = userEmitters.get(channel);
      if (channelEmitters != null) {
        for (SseEmitter emitter : new ArrayList<>(channelEmitters)) {
          try {
            emitter.send(SseEmitter.event()
                .id(System.currentTimeMillis() + "")
                .data(json)
                .build());
          } catch (IOException | IllegalStateException e) {
            channelEmitters.remove(emitter);
          }
        }
      }
    }
  }
}
```

---

## 프론트엔드 연동

### 1. WebSocket 연결 (클라이언트)

```typescript
// 프론트엔드에서는 이미 realtimeApi.ts에 구현됨
// 참고: src/services/realtimeApi.ts의 WebSocketManager 클래스
```

### 2. SSE 연결 (클라이언트)

```typescript
// 프론트엔드에서는 이미 logsApi.ts와 metricsApi.ts에 구현됨
// 참고: src/services/logsApi.ts의 subscribeSystemLogs() 함수
```

---

## 성능 최적화

### 1. 스레드 풀 설정

```yaml
spring:
  task:
    execution:
      pool:
        core-size: 10
        max-size: 20
        queue-capacity: 100
      thread-name-prefix: async-
    scheduling:
      pool:
        size: 5
      thread-name-prefix: scheduled-
```

### 2. 메모리 최적화

```java
@Configuration
public class WebSocketOptimizationConfig {

  @Bean
  public TaskExecutor taskExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setCorePoolSize(10);
    executor.setMaxPoolSize(20);
    executor.setQueueCapacity(100);
    executor.setThreadNamePrefix("websocket-");
    executor.setWaitForTasksToCompleteOnShutdown(true);
    executor.setAwaitTerminationSeconds(60);
    return executor;
  }

  @Bean
  public TaskScheduler taskScheduler() {
    ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
    scheduler.setPoolSize(5);
    scheduler.setThreadNamePrefix("scheduler-");
    scheduler.setAwaitTerminationSeconds(60);
    scheduler.setWaitForTasksToCompleteOnShutdown(true);
    return scheduler;
  }
}
```

### 3. 대역폭 최적화

```java
public class MessageCompressionUtil {

  public static String compress(Object data) throws IOException {
    String json = new ObjectMapper().writeValueAsString(data);
    
    ByteArrayOutputStream baos = new ByteArrayOutputStream();
    try (GZIPOutputStream gzipOut = new GZIPOutputStream(baos)) {
      gzipOut.write(json.getBytes(StandardCharsets.UTF_8));
    }
    
    return Base64.getEncoder().encodeToString(baos.toByteArray());
  }

  public static String decompress(String compressed) throws IOException {
    byte[] decompressed = Base64.getDecoder().decode(compressed);
    
    try (GZIPInputStream gzipIn = 
         new GZIPInputStream(new ByteArrayInputStream(decompressed))) {
      return new String(gzipIn.readAllBytes(), StandardCharsets.UTF_8);
    }
  }
}
```

---

## 모니터링 및 디버깅

### 1. WebSocket 연결 모니터링

```java
@Component
public class WebSocketMetrics {

  private final MeterRegistry meterRegistry;
  private final AtomicInteger activeConnections = new AtomicInteger(0);

  @PostConstruct
  public void init() {
    meterRegistry.gauge("websocket.connections.active", activeConnections);
  }

  public void incrementConnections() {
    activeConnections.incrementAndGet();
  }

  public void decrementConnections() {
    activeConnections.decrementAndGet();
  }
}
```

### 2. 로깅

```yaml
logging:
  level:
    org.springframework.web.socket: DEBUG
    org.springframework.messaging: DEBUG
    com.example.ezpay.modules.realtime: DEBUG
```

---

**마지막 업데이트:** 2026-06-28
