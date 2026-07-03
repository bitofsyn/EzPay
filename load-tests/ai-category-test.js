/**
 * ai-category-test.js
 * ─────────────────────────────────────────────────────────────────────────
 * 목적: ai-category-server(FastAPI, 8000) 의 계층형 추론 엔드포인트
 *       POST /categorize 가 동시 다발적 분류 요청을 받을 때의
 *       응답 지연(Timeout)과 에러율(특히 클라우드 Rate Limit 429)을 측정한다.
 *
 * 추론 경로(config.py):
 *   /categorize → [ML 1차(sklearn, 비용 0) → 확신 낮으면 LLM 에스컬레이션]
 *       LLM primary = LOCAL(LM Studio, http://localhost:1234, timeout 20s)
 *       LLM fallback = CLOUD(NVIDIA Build NIM, timeout 30s, API Key 필요)
 *   → 로컬 추론은 GPU/CPU 자원 경합으로 동시성에 취약(직렬화되기 쉬움),
 *     클라우드는 처리량은 높지만 분당 요청 제한(429) 에 걸린다.
 *
 * 실행:
 *   # 계층형 추론(LLM 포함) 부하 — 실제 병목 관측용
 *   k6 run -e AI_URL=http://localhost:8000 load-tests/ai-category-test.js
 *
 *   # 가벼운 ML 전용 엔드포인트만 때리기(기준선 비교)
 *   k6 run -e AI_URL=http://localhost:8000 -e ENDPOINT=predict load-tests/ai-category-test.js
 *
 *   # 저부하로 로컬 LM Studio 직렬화 여부만 확인
 *   k6 run -e PEAK_VUS=10 load-tests/ai-category-test.js
 * ─────────────────────────────────────────────────────────────────────────
 */
import http from 'k6/http';
import { check } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { AI_URL, randInt, randomMemo } from './lib/common.js';

// ── 커스텀 지표 ──────────────────────────────────────────────────────
const inferDuration = new Trend('inference_duration', true); // 추론 총 지연
const successRate = new Rate('inference_success');           // 2xx 비율
const timeoutRate = new Rate('inference_timeout');           // 클라이언트/게이트웨이 타임아웃
const rateLimitCount = new Counter('inference_rate_limited'); // 429(클라우드 Rate Limit)
const upstreamErr = new Counter('inference_upstream_error');  // 502(InferenceError: 두 provider 모두 실패)

// /categorize(계층형 추론) 기본. ENDPOINT=predict 로 ML 전용 비교 가능.
const ENDPOINT = (__ENV.ENDPOINT || 'categorize').toLowerCase();
const PEAK_VUS = parseInt(__ENV.PEAK_VUS || '50', 10);

// LLM 왕복은 초 단위라 트랜잭션 테스트보다 VU 를 낮게 잡는다.
// k6 자체 요청 타임아웃(초과 시 status 0 → 타임아웃으로 집계).
const CLIENT_TIMEOUT = __ENV.CLIENT_TIMEOUT || '35s';

// 단계별 지속시간은 env 로 조정(스모크/CI 는 짧게, 정식 부하는 기본값).
const RAMP_UP = __ENV.RAMP_UP || '30s';
const RAMP_PEAK = __ENV.RAMP_PEAK || '1m';
const PEAK_HOLD = __ENV.PEAK_HOLD || '2m';
const RAMP_DOWN = __ENV.RAMP_DOWN || '30s';

export const options = {
  scenarios: {
    ai_categorize: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: RAMP_UP, target: Math.round(PEAK_VUS * 0.3) }, // Ramp-up
        { duration: RAMP_PEAK, target: PEAK_VUS },                 // Peak 도달
        { duration: PEAK_HOLD, target: PEAK_VUS },                 // Peak 유지
        { duration: RAMP_DOWN, target: 0 },                        // Ramp-down
      ],
      gracefulRampDown: '30s',
    },
  },
  thresholds: {
    // 로컬 추론은 느릴 수 있으나 게이트웨이/클라이언트 타임아웃은 최소화되어야 한다.
    'inference_duration': ['p(95)<15000', 'p(99)<30000'],
    'inference_success': ['rate>0.90'],
    'inference_timeout': ['rate<0.05'],
    'http_req_failed': ['rate<0.10'],
  },
};

function buildBody(i) {
  if (ENDPOINT === 'predict' || ENDPOINT === 'predict-prob') {
    // schemas.py: PredictRequest { text }
    return JSON.stringify({ text: randomMemo() });
  }
  // llm/schemas.py: CategorizationRequest { requestId, transactionId?, rawText, amount?, currency? }
  return JSON.stringify({
    requestId: `load-${__VU}-${__ITER}-${Date.now()}`,
    transactionId: `${randInt(100000, 999999)}`,
    rawText: randomMemo(),
    amount: randInt(1000, 200000),
    currency: 'KRW',
  });
}

export default function () {
  const url = `${AI_URL}/${ENDPOINT}`;
  const res = http.post(url, buildBody(), {
    headers: { 'Content-Type': 'application/json' },
    timeout: CLIENT_TIMEOUT,
    tags: { name: ENDPOINT },
  });

  inferDuration.add(res.timings.duration);

  const ok = res.status >= 200 && res.status < 300;
  successRate.add(ok);

  // status 0 = k6 클라이언트 타임아웃, 504 = 게이트웨이 타임아웃
  timeoutRate.add(res.status === 0 || res.status === 504);
  if (res.status === 429) rateLimitCount.add(1);          // 클라우드 NVIDIA Rate Limit
  if (res.status === 502) upstreamErr.add(1);              // 두 provider 모두 실패(InferenceError)

  check(res, {
    '2xx 성공': (r) => r.status >= 200 && r.status < 300,
    'Rate Limit(429) 아님': (r) => r.status !== 429,
    'Upstream(502) 아님': (r) => r.status !== 502,
    '타임아웃 아님': (r) => r.status !== 0 && r.status !== 504,
  });
}

/*
 * ════════════════════════════════════════════════════════════════════════
 *  AI 추론 병목 체크포인트 — 응답 지연 / 에러율 해석
 * ════════════════════════════════════════════════════════════════════════
 *
 * [A] 응답 지연(Timeout)
 *     - inference_timeout rate 상승 = LM Studio(로컬) 가 동시 요청을 직렬
 *       처리하며 큐가 쌓이는 신호. 로컬 LLM 은 보통 단일 모델 인스턴스라
 *       동시성이 낮다 → VU 를 조금만 올려도 p95 가 timeout(20s)에 수렴.
 *     - config.py: LM_STUDIO_TIMEOUT_MS=20000, NVIDIA_TIMEOUT_MS=30000,
 *       AI_MAX_ATTEMPTS=2, AI_RETRY_BACKOFF_MS=500 → 최악의 경우
 *       (로컬 2회 실패 → 클라우드 2회) 누적 지연이 수십 초까지 늘 수 있다.
 *     관측: ai-category-server 로그의 "METHOD /categorize - X.XXXs" 라인,
 *          또는 Prometheus http_request_duration_seconds(main.py Instrumentator).
 *
 * [B] 에러율(Rate Limit)
 *     - inference_rate_limited(429) 증가 = 로컬 확신이 낮아 클라우드
 *       (NVIDIA Build) 로 에스컬레이션되는 요청이 급증했고, 무료/평가 티어의
 *       분당 요청 한도를 초과했다는 뜻. 이때 fallback 이 소진되면 502 로 귀결.
 *     - inference_upstream_error(502) = InferenceError. 로컬·클라우드가 모두
 *       실패(로컬 미기동 + 클라우드 429/키 미설정 등).
 *     완화: AI_ML_CONFIDENCE_THRESHOLD 를 낮춰 LLM 에스컬레이션 빈도를 줄이거나,
 *          AI_FALLBACK_ENABLED=false 로 클라우드 폭주를 차단하고 로컬로만 처리.
 *
 * [C] Kafka 경로 vs HTTP 경로
 *     - 운영 트래픽은 실제로 transaction.categorization.requested 토픽을 통해
 *       비동기로 유입된다(kafka/pipeline.py). 본 스크립트는 /categorize 를
 *       "동기 HTTP" 로 직접 때려 순수 추론 성능/한계를 격리 측정하는 용도.
 *     - 파이프라인 전체의 백프레셔는 컨슈머 Lag 로 관측(README 참고).
 */
