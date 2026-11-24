// 송금 API 부하 스크립트 (k6)
// 고정 도착률(constant-arrival-rate)로 송금을 제출한다. 제출 응답(202)과
// 실제 처리 완료는 별개이므로 end-to-end 처리량은 measure.sh 가 DB 로 집계한다.
import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:18081';
const RATE = Number(__ENV.RATE || 50);           // 초당 제출 건수
const DURATION = __ENV.DURATION || '30s';
const MIN_ID = Number(__ENV.MIN_ACCOUNT_ID || 1);
const MAX_ID = Number(__ENV.MAX_ACCOUNT_ID || 2000);

// VUS 를 주면 닫힌 모델(동시 사용자 N명이 쉬지 않고 제출)로 바꿔 제출 경로의 한계를 본다.
const VUS = Number(__ENV.VUS || 0);
const scenario = VUS > 0
  ? { executor: 'constant-vus', vus: VUS, duration: DURATION }
  : {
      executor: 'constant-arrival-rate',
      rate: RATE,
      timeUnit: '1s',
      duration: DURATION,
      preAllocatedVUs: Math.max(20, RATE),
      maxVUs: Math.max(100, RATE * 4),
    };

export const options = {
  scenarios: { transfers: scenario },
  summaryTrendStats: ['avg', 'p(50)', 'p(95)', 'p(99)', 'max'],
};

export function setup() {
  const res = http.post(`${BASE_URL}/users/login`, JSON.stringify({
    email: 'loadtest-driver@ezpay.test',
    password: 'LoadTest!2345',
  }), { headers: { 'Content-Type': 'application/json' } });
  return { token: res.json('data.token') };
}

function randomId() {
  return MIN_ID + Math.floor(Math.random() * (MAX_ID - MIN_ID + 1));
}

export default function (data) {
  const from = randomId();
  let to = randomId();
  while (to === from) to = randomId();

  const res = http.post(`${BASE_URL}/transaction/transfer`, JSON.stringify({
    fromAccountId: from,
    toAccountId: to,
    amount: 1000,
    memo: 'LOADTEST',
    category: 'ETC',
  }), {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.token}` },
    tags: { name: 'transfer' },
  });
  check(res, { accepted: (r) => r.status === 202 });
}

export function handleSummary(data) {
  return { [__ENV.SUMMARY_OUT || 'summary.json']: JSON.stringify(data) };
}
