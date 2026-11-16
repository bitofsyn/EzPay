# 주요 API

| 영역 | 경로 | 설명 |
|---|---|---|
| 인증 | `POST /users/signup` | 회원가입 |
| 인증 | `POST /users/login` | 로그인 및 토큰 발급 |
| 인증 | `POST /users/oauth/{provider}/login` | 소셜 로그인 |
| 계좌 | `GET /account/me` | 내 계좌 조회 |
| 계좌 | `POST /account` | 계좌 등록 |
| 송금 | `POST /transaction/transfer` | 송금 요청 |
| 송금 | `GET /transaction/transfer/{requestId}` | 송금 처리 결과 조회 |
| 거래 | `GET /transaction/account/{accountId}` | 계좌별 거래 내역 조회 |
| 통계 | `GET /api/statistics/spending-summary` | 소비 요약 조회 |
| 알림 | `GET /user-notifications` | 내 알림 조회 |
| 알림 | `GET /user-notifications/stream` | 실시간 알림 연결 |
| 관리자 | `GET /admin/dashboard` | 관리자 대시보드 조회 |
| 관리자 | `GET /admin/risk-transactions` | 위험 거래 조회 |
| 관리자 | `POST /admin/failed-events/{id}/retry` | 실패 이벤트 재처리 |
