# EzPay 실시간 이벤트 처리 아키텍처

**작성일:** 2026-06-28  
**기준:** 10년차 백엔드 개발자 기준 설계

---

## 📋 개요

EzPay 관리자 대시보드는 Kafka로부터의 **실시간 이벤트** (거래, 위험 감지, 시스템 로그)를 처리하여 React 프론트엔드에 실시간으로 전달합니다.

### 핵심 원칙

1. **프론트엔드는 Kafka에 직접 접근하지 않음** ← 보안 & 권한 관리
2. **백엔드에서 필터링/변환 후 전달** ← 대역폭 최적화
3. **Redis Pub/Sub으로 멀티 인스턴스 동기화** ← 수평 확장 가능
4. **WebSocket으로 양방향 저레이턴시 통신** ← SSE보다 효율적

---

## 🏗️ 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TIER 1: Kafka (Message Broker)                                              │
│ ├─ transaction-events (파티션: 9)                                           │
│ ├─ risk-detection-events (파티션: 3)                                        │
│ ├─ system-log-events (파티션: 6)                                            │
│ └─ metrics-events (파티션: 3)                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ TIER 2: Backend Event Processor (Spring Boot MSA)                           │
│                                                                              │
│ ┌──────────────────────────────────────────────────────────────────────┐    │
│ │ 1. Kafka Consumer (@KafkaListener)                                  │    │
│ │    ├─ TransactionEventConsumer (concurrency: 3)                    │    │
│ │    ├─ RiskEventConsumer (concurrency: 2)                          │    │
│ │    └─ SystemLogConsumer (concurrency: 3)                          │    │
│ │                                                                     │    │
│ │ 2. Event Processing                                               │    │
│ │    ├─ 권한 기반 필터링 (사용자/관리자/임원진)                    │    │
│ │    ├─ 심각도 기반 필터링 (DANGER/CAUTION/SAFE)                  │    │
│ │    └─ 메시지 배치/압축 (대역폭 최적화)                          │    │
│ │                                                                     │    │
│ │ 3. Event Storage                                                  │    │
│ │    ├─ Redis (최근 1000건 캐시)                                   │    │
│ │    ├─ 원형 큐 (메모리 효율, GC 최소화)                          │    │
│ │    └─ PostgreSQL (이력 저장)                                     │    │
│ │                                                                     │    │
│ │ 4. Broadcasting (클라이언트에 푸시)                              │    │
│ │    ├─ WebSocket Server (STOMP over SockJS)                       │    │
│ │    │  └─ ConnectionManager (사용자별 구독 토픽 관리)            │    │
│ │    └─ Redis Pub/Sub                                               │    │
│ │       └─ 인스턴스 간 메시지 동기화                              │    │
│ └──────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ TIER 3: Frontend (React WebSocket Client)                                   │
│ ├─ WebSocket 구독 (`/topic/admin:dashboard:transactions`)                  │
│ ├─ STOMP 프로토콜 (자동 재연결)                                             │
│ └─ 선택적 토픽 구독 (불필요한 데이터는 수신 안 함)                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 처리 흐름 상세

### 1️⃣ Kafka → 백엔드 Consumer

```
[Kafka Broker]
    ↓
[Consumer Group: admin-dashboard-consumer]
    ├─ 인스턴스 A: 파티션 0, 1, 2 담당
    ├─ 인스턴스 B: 파티션 3, 4, 5 담당
    └─ 인스턴스 C: 파티션 6, 7, 8 담당
    
각 인스턴스: 3개 스레드로 동시 처리
  - 처리 시간: 10ms 미만
  - 처리 량: 111 메시지/스레드/초 (1000 TPS ÷ 9 파티션)
  - 지연: <50ms (p99)
```

### 2️⃣ 이벤트 필터링 (권한 기반)

```
TransactionEvent
    ↓
[필터링 로직]
  ├─ 일반 사용자: 자신의 거래만 ✓
  ├─ 관리자: 모든 거래 ✓
  └─ 거래 없음: 폐기 ✗
    ↓
[심각도 필터링]
  ├─ DANGER (위험): 즉시 전송 (지연 0초)
  ├─ CAUTION (주의): 5분 단위 집계
  └─ SAFE (안전): 30분 단위 요약
    ↓
[프런트엔드 전달]
```

### 3️⃣ 데이터 저장 (3계층)

```
원형 큐 (메모리)
  ├─ 용도: 가장 빠른 조회 (O(1))
  ├─ 크기: 1000건 (타입별)
  └─ TTL: 무제한 (크기 기반 제거)
    ↓
Redis 캐시
  ├─ 용도: 다른 인스턴스 접근
  ├─ 크기: 최근 1000건
  └─ TTL: 1시간
    ↓
PostgreSQL (DB)
  ├─ 용도: 히스토리 + 분석
  ├─ 크기: 무제한
  └─ TTL: 7일 (또는 비즈니스 정책)
```

### 4️⃣ WebSocket 브로드캐스트

```
Event 발생
    ↓
[Current Instance WebSocket Server]
  └─ 연결된 클라이언트에게 직접 전송 (낮은 레이턴시)
    ↓
[Redis Pub/Sub]
  └─ 다른 인스턴스에도 전파
    ↓
[Other Instances WebSocket Server]
  └─ 각 인스턴스의 클라이언트에게 전송
```

---

## 🎯 메시지 필터링 전략

### 권한 기반 필터링

| 역할 | 조건 | 전달 데이터 |
|------|------|-----------|
| 일반 사용자 | `event.userId == currentUser.id` | 자신의 거래만 |
| 부서 관리자 | `event.department == user.department` | 부서 거래만 |
| 관리자 | 제약 없음 | 모든 거래 |
| 임원진 | 요약 데이터만 | 1시간 단위 요약 |

### 심각도 기반 필터링

```typescript
if (event.riskLevel === 'DANGER') {
  // 즉시 전송 (모든 관리자에게)
  broadcastImmediate(event);
} else if (event.riskLevel === 'CAUTION') {
  // 5분 단위 집계
  aggregateAndBroadcast(event, 5 * 60 * 1000);
} else {
  // 30분 단위 요약
  aggregateAndBroadcast(event, 30 * 60 * 1000);
}
```

### 대역폭 최적화

필요한 필드만 포함하기:

```typescript
// ❌ 과도한 데이터
{
  transactionId, amount, status, date,
  senderAccount, receiverAccount,
  metadata, logs, attachments, ...
}

// ✅ 최소한의 필드
{
  transactionId, amount, status, date,
  senderAccount: { number, bank },
  receiverAccount: { number, bank }
}
```

---

## ⚙️ 백엔드 구현 (Spring Boot)

### 1. Kafka Consumer 설정

```java
@Component
public class TransactionEventConsumer {
  
  @Autowired
  private RedisTemplate<String, TransactionEvent> redisTemplate;
  
  @Autowired
  private EventBroadcaster eventBroadcaster;
  
  @KafkaListener(
    topics = "transaction-events",
    groupId = "admin-dashboard-consumer",
    concurrency = "3"
  )
  public void consumeTransactionEvent(TransactionEvent event) {
    // 1. 필터링
    if (!shouldBroadcastEvent(event)) return;
    
    // 2. 캐시에 저장 (최근 100건)
    redisTemplate.opsForList()
      .leftPush("transactions:recent", event);
    redisTemplate.opsForList()
      .trim("transactions:recent", 0, 99);
    
    // 3. DB에 저장
    transactionRepository.save(event);
    
    // 4. 클라이언트에 브로드캐스트
    eventBroadcaster.broadcast(
      "admin:dashboard:transactions",
      event
    );
  }
  
  private boolean shouldBroadcastEvent(TransactionEvent event) {
    // 권한 기반 필터링
    User user = getCurrentUser();
    return event.getDepartment().equals(user.getDepartment())
      || user.isAdmin();
  }
}
```

### 2. WebSocket 이벤트 브로드캐스터

```java
@Component
public class EventBroadcaster {
  
  @Autowired
  private SimpMessagingTemplate messagingTemplate;
  
  @Autowired
  private RedisTemplate<String, String> redisTemplate;
  
  public void broadcast(String topic, Event event) {
    // 1. 현재 인스턴스 WebSocket 클라이언트에게 직접 전송
    messagingTemplate.convertAndSend(
      "/topic/" + topic,
      event
    );
    
    // 2. Redis Pub/Sub으로 다른 인스턴스에 전파
    redisTemplate.convertAndSend(
      "topic:" + topic,
      objectMapper.writeValueAsString(event)
    );
  }
}
```

### 3. WebSocket 설정

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
  
  @Override
  public void configureMessageBroker(MessageBrokerRegistry config) {
    config
      .enableSimpleBroker("/topic")
      .setHeartbeatValue(new long[]{25000, 25000});
    
    config.setApplicationDestinationPrefixes("/app");
  }
  
  @Override
  public void registerStompEndpoints(StompEndpointRegistry registry) {
    registry
      .addEndpoint("/ws/admin-events")
      .setAllowedOriginPatterns("*")
      .withSockJS();  // Fallback: 구형 브라우저 호환
  }
}
```

---

## 🔌 프론트엔드 구현 (React)

### 1. WebSocket 연결 훅

```typescript
import { useEffect, useState, useCallback } from 'react';
import { Client, IMessage } from '@stomp/stompjs';

export const useRealtimeTransactionStream = (
  onMessage: (tx: Transaction) => void
) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const client = new Client({
      brokerURL: process.env.REACT_APP_WS_URL 
        || 'ws://localhost:8080/ws/admin-events',
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });
    
    client.onConnect = () => {
      setIsConnected(true);
      setError(null);
      
      // 거래 이벤트 구독
      client.subscribe('/topic/admin:dashboard:transactions', 
        (message: IMessage) => {
          try {
            const event = JSON.parse(message.body);
            onMessage(event);
          } catch (e) {
            console.error('Message parsing failed:', e);
          }
        }
      );
    };
    
    client.onStompError = (frame) => {
      setError(`Connection error: ${frame.headers['message']}`);
    };
    
    client.activate();
    
    return () => {
      client.deactivate();
    };
  }, [onMessage]);
  
  return { isConnected, error };
};
```

### 2. 컴포넌트 사용 예시

```typescript
const AdminDashboard = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const { isConnected } = useRealtimeTransactionStream((tx) => {
    setTransactions((prev) => [tx, ...prev].slice(0, 50));
  });
  
  return (
    <div>
      <div className="connection-status">
        {isConnected ? '🟢 연결됨' : '🔴 연결 끊김'}
      </div>
      <TransactionList transactions={transactions} />
    </div>
  );
};
```

---

## 📈 성능 지표 및 모니터링

### 처리량

| 메트릭 | 값 | 기준 |
|--------|-----|------|
| TPS (Transaction Per Second) | 1,000 | Kafka 설정 |
| 백엔드 인스턴스 | 3 | 파티션 수 대비 |
| 동시 관리자 | 50 | 대시보드 사용자 |
| 메모리 사용 | ~16MB | WebSocket + 캐시 |
| CPU 사용 | ~15% | 처리 여유 |
| 레이턴시 (p99) | <50ms | 목표 |
| Consumer Lag | <5초 | 목표 |

### 모니터링 지표

```
1. Kafka Consumer
   ├─ Consumer Lag: lag < 5초 유지
   ├─ Processing Time: p99 < 50ms
   └─ Error Rate: < 0.1%

2. 백엔드 메모리
   ├─ Heap Usage: 최대 60% 이하
   ├─ Redis Memory: 최대 200MB
   └─ GC Pause: p99 < 100ms

3. WebSocket
   ├─ Active Connections: 모니터링
   ├─ Message Throughput: msg/sec
   └─ Reconnection Rate: 임계값 설정

4. 데이터베이스
   ├─ Insert Latency: p95 < 100ms
   └─ Slow Query Log: 활성화
```

---

## 🚀 배포 (Kubernetes)

### Pod 구성

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: admin-dashboard-backend
spec:
  replicas: 3  # 3개 인스턴스
  template:
    spec:
      containers:
      - name: backend
        image: ezpay/admin-dashboard:latest
        env:
        - name: KAFKA_BROKERS
          value: "kafka-0.kafka:9092,kafka-1.kafka:9092"
        - name: REDIS_HOST
          value: "redis-master.default"
        - name: WEBSOCKET_PORT
          value: "8080"
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
```

### Kafka 설정

```yaml
apiVersion: kafka.strimzi.io/v1beta2
kind: KafkaTopic
metadata:
  name: transaction-events
spec:
  partitions: 9
  replicationFactor: 3
  config:
    retention.ms: 604800000  # 7일
    compression.type: snappy
```

---

## ✅ 체크리스트

### 개발 단계
- [ ] Kafka Consumer 구현
- [ ] Redis 캐시 설정
- [ ] WebSocket 서버 설정
- [ ] 필터링 로직 구현
- [ ] 에러 핸들링 (재시도, 타임아웃)
- [ ] 단위 테스트 작성
- [ ] 부하 테스트 (1000+ TPS)

### 배포 전
- [ ] Kafka 파티션 수 최적화
- [ ] Redis HA 구성 (Sentinel)
- [ ] Kubernetes 리소스 요청/제한 설정
- [ ] 모니터링 (Prometheus + Grafana)
- [ ] 로그 수집 (ELK Stack)
- [ ] 보안 감시 (권한, 토큰)

### 운영 중
- [ ] Consumer Lag 모니터링
- [ ] 메모리 누수 확인
- [ ] 느린 쿼리 분석
- [ ] WebSocket 재연결율 추적
- [ ] 알림 설정 (임계값)

---

## 📚 참고 자료

- [Kafka Consumer Groups](https://kafka.apache.org/documentation/#consumerconfigs)
- [Spring Kafka](https://spring.io/projects/spring-kafka)
- [STOMP Protocol](https://stomp.github.io/)
- [Redis Pub/Sub](https://redis.io/topics/pubsub)
- [SockJS](https://github.com/sockjs/sockjs-client)

---

**마지막 업데이트:** 2026-06-28  
**담당자:** Backend Architecture Team
