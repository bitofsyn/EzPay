# EzPay Admin Dashboard API 사양서

**버전:** 1.0  
**작성일:** 2026-06-28  
**Base URL:** `http://localhost:8080/api/v1`

---

## 📋 목차

1. [인증](#인증)
2. [응답 형식](#응답-형식)
3. [Risk Transaction API](#risk-transaction-api)
4. [System Logs API](#system-logs-api)
5. [Dashboard API](#dashboard-api)
6. [User Management API](#user-management-api)
7. [Realtime Stream API](#realtime-stream-api)

---

## 인증

모든 요청은 Authorization 헤더에 JWT 토큰을 포함해야 합니다.

```
Authorization: Bearer {token}
```

---

## 응답 형식

### 성공 응답

```json
{
  "status": "success",
  "message": "요청 처리 성공",
  "data": { ... }
}
```

### 실패 응답

```json
{
  "status": "error",
  "message": "오류 메시지",
  "data": null,
  "errorCode": "ERROR_CODE"
}
```

### Status Codes
- `200` - 성공
- `400` - 잘못된 요청
- `401` - 인증 실패
- `403` - 권한 없음
- `404` - 리소스 없음
- `500` - 서버 오류

---

## Risk Transaction API

### 1. 위험 거래 목록 조회

**Endpoint:** `GET /admin/risk-transactions`

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| filter | string | N | 필터 조건 (ALL, DANGER, CAUTION, SAFE) |
| limit | number | N | 조회 건수 (기본값: 100) |
| offset | number | N | 시작 위치 (기본값: 0) |

**Response:**
```json
{
  "status": "success",
  "message": "위험 거래 목록 조회 성공",
  "data": [
    {
      "transactionId": "TX001",
      "level": "DANGER",
      "sender": "소윤",
      "receiver": "박서준",
      "amount": 980000,
      "datetime": "2026-06-28T10:30:00",
      "category": "기타",
      "reason": "고액 + 야간 시간대 + 신규 수취인",
      "status": "PENDING_REVIEW"
    }
  ]
}
```

### 2. 위험 거래 승인

**Endpoint:** `POST /admin/risk-transactions/{transactionId}/approve`

**URL Parameters:**
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| transactionId | string | 거래 ID |

**Request Body:**
```json
{
  "comment": "검토 완료, 정상 거래로 판단됨" // 선택사항
}
```

**Response:**
```json
{
  "status": "success",
  "message": "거래 승인 완료",
  "data": {
    "transactionId": "TX001",
    "status": "APPROVED",
    "approvedAt": "2026-06-28T10:35:00",
    "approvedBy": "admin@ezpay.com"
  }
}
```

### 3. 위험 거래 차단

**Endpoint:** `POST /admin/risk-transactions/{transactionId}/block`

**URL Parameters:**
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| transactionId | string | 거래 ID |

**Request Body:**
```json
{
  "reason": "의심거래로 판단되어 차단",
  "notifyUser": true
}
```

**Response:**
```json
{
  "status": "success",
  "message": "거래 차단 완료",
  "data": {
    "transactionId": "TX001",
    "status": "BLOCKED",
    "blockedAt": "2026-06-28T10:35:00",
    "blockedBy": "admin@ezpay.com"
  }
}
```

---

## System Logs API

### 1. 시스템 로그 조회

**Endpoint:** `GET /admin/system-logs`

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| limit | number | N | 조회 건수 (기본값: 30) |
| level | string | N | 로그 레벨 (INFO, WARN, ERROR, DEBUG) |
| service | string | N | 서비스명 필터링 |
| startDate | string | N | 시작 날짜 (ISO 8601) |
| endDate | string | N | 종료 날짜 (ISO 8601) |

**Response:**
```json
{
  "status": "success",
  "message": "시스템 로그 조회 성공",
  "data": [
    {
      "id": 1001,
      "timestamp": "2026-06-28T14:30:00",
      "level": "ERROR",
      "service": "transfer-service",
      "message": "고액 송금 검증 응답 지연",
      "metadata": {
        "requestId": "req-12345",
        "duration": 5000
      }
    }
  ]
}
```

### 2. 시스템 로그 실시간 스트림 (SSE)

**Endpoint:** `GET /admin/stream/system-logs`

**설명:** Server-Sent Events로 실시간 로그 스트림

**Response Format (SSE):**
```
event: log
id: 1001
data: {"id":1001,"timestamp":"2026-06-28T14:30:00","level":"ERROR","service":"transfer-service","message":"..."}

event: log
id: 1002
data: {"id":1002,"timestamp":"2026-06-28T14:31:00","level":"INFO","service":"auth-service","message":"..."}
```

---

## Dashboard API

### 1. 대시보드 메트릭 조회

**Endpoint:** `GET /admin/dashboard/metrics`

**Response:**
```json
{
  "status": "success",
  "message": "대시보드 메트릭 조회 성공",
  "data": {
    "totalUsers": 1284,
    "activeUsers": 1132,
    "inactiveUsers": 126,
    "lockedUsers": 26,
    "totalTransactions": 18642,
    "totalVolume": 842300000,
    "dailyTransactionCount": 328,
    "dailyTransactionVolume": 17450000,
    "totalAccounts": 2198,
    "recentErrors": 3,
    "lastUpdated": "2026-06-28T14:35:00"
  }
}
```

### 2. TPS 메트릭 조회

**Endpoint:** `GET /admin/dashboard/tps-metrics`

**Response:**
```json
{
  "status": "success",
  "message": "TPS 메트릭 조회 성공",
  "data": {
    "currentTPS": 42,
    "peakTPS": 158,
    "avgTPS": 95.5,
    "successRate": 99.2,
    "failureRate": 0.8,
    "timestamp": "2026-06-28T14:35:00"
  }
}
```

### 3. 시간대별 거래량 조회

**Endpoint:** `GET /admin/dashboard/hourly-transactions`

**Response:**
```json
{
  "status": "success",
  "message": "시간대별 거래량 조회 성공",
  "data": [
    {
      "hour": "09",
      "transactionCount": 18,
      "totalVolume": 920000
    },
    {
      "hour": "10",
      "transactionCount": 26,
      "totalVolume": 1310000
    }
  ]
}
```

### 4. 주간 거래 추이 조회

**Endpoint:** `GET /admin/dashboard/weekly-trend`

**Response:**
```json
{
  "status": "success",
  "message": "주간 거래 추이 조회 성공",
  "data": [
    {
      "date": "06-22",
      "dayOfWeek": "일",
      "transactionCount": 198,
      "totalVolume": 12300000
    }
  ]
}
```

### 5. 최근 활동 조회

**Endpoint:** `GET /admin/dashboard/recent-activities`

**Query Parameters:**
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| limit | number | 조회 건수 (기본값: 10) |

**Response:**
```json
{
  "status": "success",
  "message": "최근 활동 조회 성공",
  "data": [
    {
      "type": "TRANSFER",
      "description": "고액 송금 거래가 승인되었습니다",
      "timestamp": "2026-06-28T14:32:00",
      "status": "SUCCESS",
      "userName": "김민수"
    }
  ]
}
```

### 6. TPS 메트릭 실시간 스트림 (SSE)

**Endpoint:** `GET /admin/stream/tps-metrics`

**Response Format (SSE):**
```
event: metrics
id: timestamp
data: {"currentTPS":42,"peakTPS":158,"avgTPS":95.5,"successRate":99.2,"failureRate":0.8,"timestamp":"..."}
```

### 7. 활동 실시간 스트림 (SSE)

**Endpoint:** `GET /admin/stream/activities`

**Response Format (SSE):**
```
event: activity
id: timestamp
data: {"type":"TRANSFER","description":"...","timestamp":"...","status":"SUCCESS","userName":"..."}
```

---

## User Management API

### 1. 사용자 목록 조회

**Endpoint:** `GET /admin/users`

**Query Parameters:**
| 파라미터 | 타입 | 설명 |
|---------|------|------|
| status | string | 상태 필터 (ALL, ACTIVE, INACTIVE, LOCKED) |
| search | string | 이름, 이메일, 전화번호 검색 |
| limit | number | 조회 건수 |
| offset | number | 시작 위치 |

**Response:**
```json
{
  "status": "success",
  "message": "사용자 목록 조회 성공",
  "data": [
    {
      "userId": 101,
      "email": "soyun@example.com",
      "name": "소윤",
      "phoneNumber": "010-1234-5678",
      "status": "ACTIVE",
      "createdAt": "2026-06-01T09:00:00"
    }
  ]
}
```

### 2. 사용자 상태 변경

**Endpoint:** `PATCH /admin/users/{userId}/status`

**Request Body:**
```json
{
  "status": "LOCKED",
  "reason": "의심거래로 인한 임시 잠금"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "사용자 상태 변경 완료",
  "data": {
    "userId": 101,
    "status": "LOCKED",
    "updatedAt": "2026-06-28T14:35:00"
  }
}
```

### 3. 사용자 삭제

**Endpoint:** `DELETE /admin/users/{userId}`

**Response:**
```json
{
  "status": "success",
  "message": "사용자 삭제 완료",
  "data": null
}
```

### 4. 사용자 상세 조회

**Endpoint:** `GET /admin/users/{userId}`

**Response:**
```json
{
  "status": "success",
  "message": "사용자 상세 조회 성공",
  "data": {
    "userInfo": {
      "userId": 101,
      "name": "소윤",
      "email": "soyun@example.com",
      "phone": "010-1234-5678",
      "status": "ACTIVE",
      "createdAt": "2026-06-01T09:00:00"
    },
    "accounts": [
      {
        "accountId": 1,
        "bankName": "EzBank",
        "accountNumber": "1112345678",
        "balance": 3200000,
        "main": true,
        "createdAt": "2026-06-02T10:00:00"
      }
    ],
    "transactions": [
      {
        "transactionId": 9001,
        "amount": 650000,
        "transactionDate": "2026-06-28T14:20:00",
        "description": "월세 이체"
      }
    ]
  }
}
```

---

## Realtime Stream API

### 1. 거래 실시간 스트림 (WebSocket)

**Endpoint:** `ws://localhost:8080/ws/admin-events`

**연결 후:**
```javascript
// 거래 구독
{
  "action": "subscribe",
  "topic": "admin:dashboard:transactions"
}

// 수신 메시지
{
  "topic": "admin:dashboard:transactions",
  "data": {
    "transactionId": 1,
    "amount": 50000,
    "status": "SUCCESS",
    "transactionDate": "2026-06-28T14:52:30",
    "senderAccount": { "accountNumber": "110-123-456", "bankName": "우리은행" },
    "receiverAccount": { "accountNumber": "340-000-001", "bankName": "국민은행" }
  }
}
```

### 2. 위험 거래 실시간 스트림 (WebSocket)

**Topic:** `admin:dashboard:risk-transactions`

**메시지 형식:**
```json
{
  "topic": "admin:dashboard:risk-transactions",
  "data": {
    "transactionId": "TX001",
    "level": "DANGER",
    "sender": "박서준",
    "receiver": "이지현",
    "amount": 980000,
    "datetime": "2026-06-28T23:55:00",
    "category": "기타",
    "reason": "고액 + 야간 시간대 + 신규 수취인"
  }
}
```

---

## 에러 코드

| 코드 | HTTP | 설명 |
|------|------|------|
| INVALID_TOKEN | 401 | 유효하지 않은 토큰 |
| UNAUTHORIZED | 403 | 권한 없음 |
| NOT_FOUND | 404 | 리소스 없음 |
| VALIDATION_ERROR | 400 | 입력값 오류 |
| INTERNAL_SERVER_ERROR | 500 | 서버 오류 |
| KAFKA_PUBLISH_ERROR | 500 | Kafka 발행 실패 |
| DATABASE_ERROR | 500 | 데이터베이스 오류 |

---

## Rate Limiting

- 일반 API: 1000 요청/분
- Stream API (SSE/WebSocket): 제한 없음

---

## CORS 설정

허용된 Origin:
- http://localhost:3000 (개발)
- http://localhost:5173 (Vite 개발)
- https://app.ezpay.com (운영)

---

**마지막 업데이트:** 2026-06-28
