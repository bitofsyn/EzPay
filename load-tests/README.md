# EzPay 부하 테스트 (Load Tests)

트랜잭션 처리 파이프라인과 마이크로서비스(결제/송금 API, `ai-category-server`)가
대용량 트래픽에서 어떻게 동작하는지 검증하기 위한 [k6](https://k6.io) 기반 스크립트 모음.

```
load-tests/
├── transaction-stress-test.js   # 송금/결제 접수 API 대용량 부하
├── ai-category-test.js          # AI 분류 서버(LM Studio+NVIDIA) 단독 부하
├── lib/common.js                # 로그인·환경변수·랜덤 헬퍼(공용)
└── README.md
```

## 왜 k6 인가

- **개발자 친화적**: 시나리오를 JS 로 작성 → 코드 리뷰/버전 관리 용이.
- **부하 생성 효율**: Go 런타임이라 단일 머신에서 수천 VU 를 낮은 오버헤드로 생성.
- **Thresholds(SLO) 내장**: 임계치 위반 시 exit code≠0 → CI(Jenkins) 게이트로 바로 활용.
- **Prometheus 연동**: 이미 백엔드/AI 서버가 Prometheus 를 노출(`/actuator/prometheus`,
  `/metrics`)하므로 k6 결과와 서버 내부 지표를 같은 Grafana 에서 상관분석 가능.

## 사전 준비

1. **k6 설치**
   ```bash
   brew install k6            # macOS
   # 또는 docker: docker run --rm -i grafana/k6 run - < transaction-stress-test.js
   ```
2. **대상 시스템 기동** — `docker-compose up backend ai-category kafka zookeeper`
3. **부하 전용 계정 & 계좌 준비** — `/transaction/**` 는 JWT 인증이 필요하다.
   회원가입(`POST /users/signup`) 후, 송금에 쓸 계좌 ID 범위를 확인해 둔다.

## 실행 방법

### 1) 트랜잭션 스트레스 테스트

```bash
k6 run \
  -e BASE_URL=http://localhost:8081 \
  -e LOGIN_EMAIL=loadtest@ezpay.com \
  -e LOGIN_PASSWORD='LoadTest123!' \
  -e FROM_ACCOUNT_MIN=1  -e FROM_ACCOUNT_MAX=20 \
  -e TO_ACCOUNT_MIN=21   -e TO_ACCOUNT_MAX=40 \
  -e PEAK_VUS=300 \
  load-tests/transaction-stress-test.js
```

부하 패턴(Ramp-up → Peak → Ramp-down, 총 ~6분):

| 단계 | 시간 | VU (PEAK_VUS=300 기준) |
|------|------|------------------------|
| 워밍업        | 30s | 0 → 60 |
| 점진적 증가   | 1m  | 60 → 150 |
| Peak 도달     | 1m  | 150 → 300 |
| **Peak 유지** | 2m  | 300 (정상상태 관측) |
| 감소          | 1m  | 300 → 90 |
| Ramp-down     | 30s | 90 → 0 |

> `PEAK_VUS` 로 최대 부하를 조정. 수백 명 동시 접속을 재현하려면 `-e PEAK_VUS=500` 이상.

### 2) AI 분류 서버 단독 테스트

```bash
# 계층형 추론(ML→LLM 에스컬레이션) 부하 — 실제 병목 관측
k6 run -e AI_URL=http://localhost:8000 -e PEAK_VUS=50 load-tests/ai-category-test.js

# ML 전용 경량 엔드포인트 기준선
k6 run -e AI_URL=http://localhost:8000 -e ENDPOINT=predict load-tests/ai-category-test.js
```

### CI(Jenkins)에서 게이트로 쓰기

```bash
k6 run --quiet --summary-export=result.json load-tests/transaction-stress-test.js
# thresholds 위반 시 k6 가 non-zero exit → 파이프라인 실패 처리
```

## 부하 중 병목 모니터링 가이드

부하를 거는 동안 **별도 터미널**에서 아래를 관측한다. (Grafana 대시보드가 있으면 그쪽 우선)

### A. Spring Boot 커넥션 풀 / 스레드 풀

`application.yml` 기준 **HikariCP `maximum-pool-size=10`**, `@Async` 풀 `max-size=100 / queue=500`.

```bash
# 활성 커넥션(상시 10 에 붙어있으면 포화)
watch -n1 'curl -s localhost:8081/actuator/metrics/hikaricp.connections.active | jq ".measurements[0].value"'
# 커넥션 획득 대기 중인 요청 수(>0 지속 = 병목)
curl -s localhost:8081/actuator/metrics/hikaricp.connections.pending  | jq
# 획득 타임아웃(30s 초과) 누계 — 증가하면 500 실패 발생 중
curl -s localhost:8081/actuator/metrics/hikaricp.connections.timeout  | jq
# 톰캣 워커 / @Async executor
curl -s localhost:8081/actuator/metrics/tomcat.threads.busy | jq
curl -s localhost:8081/actuator/metrics/executor.queued     | jq   # queue-capacity(500) 근접 시 거부 임박
```

**해석**: `active`가 10에 고정 + `pending`이 계속 쌓임 → HikariCP 가 1차 병목.
→ `maximum-pool-size` 상향(단, DB `max_connections` 와 CPU 코어 수 고려) 또는 트랜잭션 단축.

### B. Kafka Consumer Lag 모니터링

접수(202)는 빨라도 컨슈머가 못 따라오면 "접수됐지만 미처리" 거래가 쌓인다.
**Lag(브로커에 쌓인 메시지 − 컨슈머가 읽은 offset)** 가 지속 증가하면 컨슈머 처리량 부족.

```bash
# 그룹별 LAG 을 1초마다 관측 (transaction.*, ai-category-group 등)
watch -n1 'docker exec kafka kafka-consumer-groups \
  --bootstrap-server localhost:9092 --describe --all-groups'
```

출력의 `LAG` 컬럼을 본다:

| 관측 | 의미 | 조치 |
|------|------|------|
| LAG ≈ 0 유지 | 컨슈머가 실시간 처리 중 | 정상 |
| LAG 완만 증가 후 회복 | 순간 스파이크 흡수 | 허용 범위 |
| **LAG 단조 증가** | 프로듀서 > 컨슈머 처리량 | **파티션 수↑ + 컨슈머 인스턴스↑**, 컨슈머 배치/DB write 최적화 |
| DLT 토픽 증가 | 처리 실패 폭증 | `transaction.categorization.requested.DLT` 원인 분석 |

> Prometheus 를 쓰면 `kafka_consumergroup_lag`(kafka-exporter) 를 Grafana 패널로 두는 것을 권장.

### C. AI 추론 지연 / Rate Limit

`ai-category-test.js` 커스텀 지표로 직접 관측된다:

- `inference_timeout` ↑ → 로컬 LM Studio 직렬화(동시성 부족). VU 를 낮춰 재현.
- `inference_rate_limited`(429) ↑ → 클라우드(NVIDIA) 에스컬레이션이 분당 한도 초과.
- `inference_upstream_error`(502) ↑ → 로컬·클라우드 모두 실패(InferenceError).

서버 측: `curl -s localhost:8000/metrics | grep http_request_duration_seconds` 및
컨테이너 로그의 `METHOD /categorize - X.XXXs` 라인.

---

## 예상 취약 지점 분석 (장애 발생 순서)

현재 아키텍처를 논리적으로 분석했을 때, 부하 증가 시 **아래 순서로** 한계에 도달할 것으로 예상된다.

**① AI 분류 서버의 로컬 추론(LM Studio) — 가장 먼저, 가장 낮은 임계에서 터짐**
`ai-category-server` 의 1차 LLM 은 로컬 LM Studio 단일 모델 인스턴스로, 요청을 사실상
**직렬 처리**한다. 동시 요청이 수십 건만 되어도 큐가 쌓여 `LM_STUDIO_TIMEOUT_MS(20s)` 를
초과하고, `AI_MAX_ATTEMPTS=2` 재시도까지 겹치면 지연이 배가된다. → **가장 먼저 타임아웃 급증.**
이때 클라우드(NVIDIA)로 대량 에스컬레이션되며 **429 Rate Limit** 이 뒤따르고, fallback 이
소진되면 502 로 귀결된다. 다만 운영 경로는 Kafka 비동기라 이 지연은 사용자 응답이 아니라
**Consumer Lag** 형태로 나타난다(체감 장애는 "카테고리가 늦게 붙음").

**② Spring Boot HikariCP 커넥션 풀 (`maximum-pool-size=10`) — 결제 경로의 실질적 병목**
송금 API 는 202 를 빠르게 주는 비동기 구조지만, 접수 시점에 **DB 쓰기(거래 저장)** 가 일어난다.
동시 VU 가 10을 넘으면 커넥션 대기가 시작되고, 대기가 `connection-timeout(30s)` 를 넘기면
**500 에러**로 실패한다. 수백 VU 환경에서 풀 10은 명백히 과소 → 접수 성공률(202)이 무너지는
**가장 현실적인 단일 장애점(SPOF)**. (톰캣 스레드 200 보다 풀 10이 먼저 고갈된다.)

**③ Kafka 컨슈머 처리량 (파티션/컨슈머 수)**
프로듀서(접수)는 빠른데 컨슈머가 DB 쓰기·AI 분류를 동반해 느리면 **Lag 이 단조 증가**한다.
단일 컨슈머/단일 파티션 구성이면 수평 확장이 막혀 백로그가 무한정 쌓이고, 재시도 실패분이
**DLT** 로 흘러 데이터 정합성(미정산 거래) 문제로 확대된다.

**④ @Async 태스크 풀 큐 포화 (`queue-capacity=500`)**
알림/후처리 등 비동기 작업이 초당 유입을 못 따라가면 큐(500)가 차고 이후
`RejectedExecutionException` 이 발생. ①~③ 보다는 뒤에 오지만, 알림 유실로 이어진다.

**⑤ JVM 힙 / GC**
지속 Peak 에서 객체 할당 압박으로 GC pause 가 늘면 p99 지연이 튄다. 보통 위 병목들보다
나중에 드러난다.

### 결론 (우선 개선 순위)
1. **HikariCP `maximum-pool-size` 상향** (예: 10 → 30~50, DB `max_connections` 와 CPU 코어에 맞춰) — 결제 경로 최우선.
2. **AI 파이프라인 격리·백프레셔**: LLM 에스컬레이션 임계(`AI_ML_CONFIDENCE_THRESHOLD`) 조정, 로컬 동시성 한계 인지, 클라우드 Rate Limit 대비 큐잉/속도제한.
3. **Kafka 파티션 수 + 컨슈머 인스턴스 확장**으로 Lag 수평 흡수, DLT 모니터링 상시화.
