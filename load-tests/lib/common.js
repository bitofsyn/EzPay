// 공통 유틸: 환경변수 파싱 · 로그인 · 랜덤 헬퍼
// 모든 k6 스크립트가 공유한다. 값은 전부 환경변수(-e KEY=VALUE)로 주입.
import http from 'k6/http';
import { check } from 'k6';

// ── 대상 시스템 엔드포인트 ───────────────────────────────────────────
// 백엔드(Spring Boot, 기본 8081)와 ai-category-server(FastAPI, 기본 8000).
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:8081';
export const AI_URL = __ENV.AI_URL || 'http://localhost:8000';

// ── 인증 계정 ────────────────────────────────────────────────────────
// /transaction/** 는 SecurityConfig 상 인증 필요(anyRequest().authenticated()).
// JWT 는 Authorization: Bearer 헤더로 전달 가능(JwtAuthenticationFilter 하위호환 경로).
export const LOGIN_EMAIL = __ENV.LOGIN_EMAIL || 'loadtest@ezpay.com';
export const LOGIN_PASSWORD = __ENV.LOGIN_PASSWORD || 'LoadTest123!';

// ── 송금 대상 계좌 ID 범위 ───────────────────────────────────────────
// 실제 DB 에 존재하는 계좌 ID 로 맞춰서 주입해야 한다(미존재 시 400).
export const FROM_ACCOUNT_MIN = intEnv('FROM_ACCOUNT_MIN', 1);
export const FROM_ACCOUNT_MAX = intEnv('FROM_ACCOUNT_MAX', 1);
export const TO_ACCOUNT_MIN = intEnv('TO_ACCOUNT_MIN', 2);
export const TO_ACCOUNT_MAX = intEnv('TO_ACCOUNT_MAX', 2);

export function intEnv(key, fallback) {
  const v = __ENV[key];
  return v === undefined ? fallback : parseInt(v, 10);
}

export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomAmount() {
  // 100 ~ 50,000 사이 소액 송금(잔액 고갈로 인한 대량 400 을 피하기 위함).
  return (randInt(100, 50000)).toFixed(2);
}

// 무작위 거래 메모(ai-category-server 분류 입력으로도 재사용).
const MEMOS = [
  '스타벅스 아메리카노', 'GS25 편의점 결제', '넷플릭스 정기결제', '카카오택시 요금',
  '월세 이체', '점심 김치찌개', '쿠팡 생필품 주문', '병원 진료비', '헬스장 등록비',
  '전기요금 자동납부', '친구 생일 선물', '주유소 휘발유', '학원 수강료', '반려동물 사료',
];
export function randomMemo() {
  return MEMOS[randInt(0, MEMOS.length - 1)];
}

// 로그인 후 JWT 토큰 반환. setup() 에서 1회 호출해 전 VU 가 공유하는 패턴 권장.
// 계정이 없으면 회원가입을 선행할 수 있으므로 실패해도 null 을 반환(호출측에서 판단).
export function login(email = LOGIN_EMAIL, password = LOGIN_PASSWORD) {
  const res = http.post(
    `${BASE_URL}/users/login`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' }, tags: { name: 'login' } },
  );
  const ok = check(res, {
    'login 200': (r) => r.status === 200,
    'login 토큰 존재': (r) => {
      try { return !!r.json('data.token'); } catch (e) { return false; }
    },
  });
  if (!ok) {
    console.error(`[login 실패] status=${res.status} body=${String(res.body).slice(0, 200)}`);
    return null;
  }
  return res.json('data.token');
}

// 인증 헤더 빌더.
export function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}
