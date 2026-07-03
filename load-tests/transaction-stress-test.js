/**
 * transaction-stress-test.js
 * ─────────────────────────────────────────────────────────────────────────
 * 목적: 결제/송금 트랜잭션 파이프라인(POST /transaction/transfer)이 대용량
 *       동시 트래픽에서 어떻게 버티는지 검증한다.
 *
 * 아키텍처 흐름:
 *   k6(VU 수백) → Spring Boot(/transaction/transfer)
 *              → TransactionService.transferMoney() → DB(HikariCP) 쓰기
 *              → Kafka produce(transaction.*) → 비동기 컨슈머 처리
 *   컨트롤러는 202 ACCEPTED + requestId 를 즉시 반환(비동기). 실제 정산은
 *   Kafka 컨슈머가 처리하므로, HTTP 지표만으로는 "접수 성능"만 보이고
 *   "처리 성능"은 컨슈머 Lag(README 참고)로 별도 관측해야 한다.
 *
 * 실행:
 *   k6 run -e BASE_URL=http://localhost:8081 \
 *          -e LOGIN_EMAIL=you@ezpay.com -e LOGIN_PASSWORD='Pw123!@#' \
 *          -e FROM_ACCOUNT_MIN=1 -e FROM_ACCOUNT_MAX=20 \
 *          -e TO_ACCOUNT_MIN=21 -e TO_ACCOUNT_MAX=40 \
 *          load-tests/transaction-stress-test.js
 * ─────────────────────────────────────────────────────────────────────────
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import {
  BASE_URL, login, authHeaders,
  randInt, randomAmount, randomMemo,
  FROM_ACCOUNT_MIN, FROM_ACCOUNT_MAX, TO_ACCOUNT_MIN, TO_ACCOUNT_MAX,
} from './lib/common.js';

// ── 커스텀 지표 ──────────────────────────────────────────────────────
const transferDuration = new Trend('transfer_duration', true); // 접수(202)까지 지연
const transferAccepted = new Rate('transfer_accepted');        // 202 비율
const transferErrors = new Counter('transfer_errors');         // 5xx/네트워크 오류 수
const businessRejected = new Rate('transfer_business_rejected'); // 400(한도초과/잔액 등)

// ── 부하 시나리오: Ramp-up → Peak → Ramp-down ────────────────────────
// 필요 시 -e PEAK_VUS=500 로 최대 부하를 조정한다.
const PEAK_VUS = parseInt(__ENV.PEAK_VUS || '300', 10);
// 단계별 지속시간은 env 로 조정(스모크/CI 는 짧게, 정식 부하는 기본값).
const WARMUP = __ENV.WARMUP || '30s';
const RAMP_UP = __ENV.RAMP_UP || '1m';
const RAMP_PEAK = __ENV.RAMP_PEAK || '1m';
const PEAK_HOLD = __ENV.PEAK_HOLD || '2m';
const RAMP_DOWN1 = __ENV.RAMP_DOWN1 || '1m';
const RAMP_DOWN2 = __ENV.RAMP_DOWN2 || '30s';
export const options = {
  scenarios: {
    transfer_traffic: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: WARMUP, target: Math.round(PEAK_VUS * 0.2) },    // 워밍업
        { duration: RAMP_UP, target: Math.round(PEAK_VUS * 0.5) },   // 점진적 증가
        { duration: RAMP_PEAK, target: PEAK_VUS },                   // Peak 도달
        { duration: PEAK_HOLD, target: PEAK_VUS },                   // Peak 유지(정상상태 관측)
        { duration: RAMP_DOWN1, target: Math.round(PEAK_VUS * 0.3) },// 감소
        { duration: RAMP_DOWN2, target: 0 },                         // Ramp-down
      ],
      gracefulRampDown: '20s',
    },
  },
  // ── 병목 검증용 임계치(SLO) ─────────────────────────────────────────
  // 이 임계치가 깨지면 아래 "병목 체크포인트"를 순서대로 점검한다.
  thresholds: {
    // 접수 응답은 비동기라 빠르게 유지되어야 한다. p95 가 치솟으면 HikariCP
    // 커넥션 대기(획득 30s 타임아웃) 또는 톰캣 워커 스레드 포화 신호.
    'http_req_duration{name:transfer}': ['p(95)<800', 'p(99)<2000'],
    'transfer_accepted': ['rate>0.95'],   // 95% 이상 정상 접수
    'transfer_errors': ['count<50'],       // 5xx 는 사실상 0 이어야 함
    'http_req_failed': ['rate<0.05'],
  },
};

// setup: 로그인 1회 → 토큰을 전 VU 가 공유(로그인 자체가 부하가 되지 않도록).
export function setup() {
  const token = login();
  if (!token) {
    throw new Error('로그인 실패 — 계정/비밀번호(-e LOGIN_EMAIL,-e LOGIN_PASSWORD) 또는 백엔드 기동 상태를 확인하세요.');
  }
  return { token };
}

export default function (data) {
  const headers = authHeaders(data.token);

  const payload = JSON.stringify({
    fromAccountId: randInt(FROM_ACCOUNT_MIN, FROM_ACCOUNT_MAX),
    toAccountId: randInt(TO_ACCOUNT_MIN, TO_ACCOUNT_MAX),
    amount: randomAmount(),
    memo: randomMemo(),
    category: '', // 비워두면 서버/AI 분류 파이프라인이 카테고리를 채운다.
    isCategoryManuallyEdited: false,
  });

  const res = http.post(`${BASE_URL}/transaction/transfer`, payload, {
    headers,
    tags: { name: 'transfer' }, // http_req_duration{name:transfer} 로 필터링
  });

  transferDuration.add(res.timings.duration);

  // 컨트롤러 규약: 202=접수 성공, 400=비즈니스 검증 실패, 5xx=서버 오류
  const accepted = res.status === 202;
  transferAccepted.add(accepted);
  businessRejected.add(res.status === 400);
  if (res.status >= 500 || res.status === 0) {
    transferErrors.add(1);
  }

  check(res, {
    'transfer 202 접수': (r) => r.status === 202,
    'requestId 반환': (r) => {
      if (r.status !== 202) return true; // 400 은 별도 지표에서 집계
      try { return !!r.json('data'); } catch (e) { return false; }
    },
    '5xx 아님': (r) => r.status < 500,
  });

  // 실제 사용자 행동을 흉내내는 짧은 think-time(0.5~1.5s).
  sleep(randInt(500, 1500) / 1000);
}

/*
 * ════════════════════════════════════════════════════════════════════════
 *  병목(Bottleneck) 체크포인트 — 테스트 중 별도 터미널/Grafana 에서 관측
 * ════════════════════════════════════════════════════════════════════════
 *
 * [1] Spring Boot HikariCP 커넥션 풀 (application.yml: maximum-pool-size=10)
 *     → 가장 먼저 터질 지점. VU 가 풀(10) 을 초과하면 커넥션 대기가 발생하고
 *       connection-timeout=30s 초과 시 요청이 500 으로 실패한다.
 *     관측:
 *       watch -n1 'curl -s localhost:8081/actuator/metrics/hikaricp.connections.active | jq .measurements'
 *       curl -s localhost:8081/actuator/metrics/hikaricp.connections.pending   # 대기 중 요청
 *       curl -s localhost:8081/actuator/metrics/hikaricp.connections.timeout   # 획득 타임아웃 누계
 *     경고 신호: active 가 상시 10 에 붙어있고 pending>0 이 지속.
 *
 * [2] 톰캣 워커 스레드 풀 (기본 max=200) + @Async task 풀
 *     (application.yml: task.execution.pool max-size=100, queue-capacity=500)
 *     → 커넥션이 풀려도 스레드가 부족하면 큐잉/거부가 발생.
 *     관측:
 *       curl -s localhost:8081/actuator/metrics/tomcat.threads.busy
 *       curl -s localhost:8081/actuator/metrics/executor.queued        # @Async 대기 큐
 *       curl -s localhost:8081/actuator/metrics/executor.active
 *     경고 신호: executor.queued 가 queue-capacity(500) 에 수렴 → 이후 RejectedExecution.
 *
 * [3] Kafka 프로듀서/컨슈머 지연 (transaction.* 토픽)
 *     → 202 는 빨라도 컨슈머 Lag 가 쌓이면 "접수됐지만 정산 안 된" 거래가 누적.
 *     관측(브로커 컨테이너에서):
 *       docker exec -it kafka kafka-consumer-groups --bootstrap-server localhost:9092 \
 *         --describe --all-groups         # LAG 컬럼이 계속 증가하면 컨슈머 처리량 부족
 *     상세 가이드는 load-tests/README.md 의 "Kafka Consumer Lag 모니터링" 참고.
 *
 * [4] JVM / GC
 *       curl -s localhost:8081/actuator/metrics/jvm.memory.used
 *       curl -s localhost:8081/actuator/metrics/jvm.gc.pause
 *     경고 신호: gc.pause p99 급증 → 힙 부족으로 인한 stop-the-world.
 */
