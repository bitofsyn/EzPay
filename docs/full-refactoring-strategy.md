# EzPay 전체 리팩토링 전략

현재 대시보드 디자인 개편을 기점으로 **사용자/관리자별 백엔드 및 프론트엔드 전체 재구성**

---

## 1. 현재 상태 분석

### 1.1 프론트엔드 구조
```
사용자 뷰 (Dashboard)          관리자 뷰 (AdminDashboard)
├── 개인 자산 관리             ├── 전체 사용자 모니터링
├── 거래 내역 관리             ├── 거래 모니터링  
├── 계좌 관리                  ├── 송금 한도 관리
├── 송금/송금하기              ├── 에러 로그
└── 설정                       └── 실시간 활동 대시보드
```

**문제점:**
- 두 뷰의 API 응답 구조 불일치
- 사용자 데이터와 관리자 데이터 혼재
- 레이아웃/헤더/사이드바가 서로 다름 → 코드 중복

### 1.2 백엔드 구조
```
Controller (DashboardController, AdminDashboardController, ...)
    ↓
Service (DashboardServiceImpl, AdminServiceImpl, ...)
    ↓
Repository (TransactionRepository, AccountRepository, ...)
    ↓
Entity (User, Accounts, Transaction, ...)
```

**문제점:**
- API 응답이 엔티티 직렬화에 의존 → 순환 참조, 불필요 필드 노출
- 사용자/관리자 API 응답 스펙이 분산됨
- 거래 데이터에 상대방 이름 없음 (상대 유저 정보 미노출)
- 월간 통계, 자주 보내는 친구 같은 복잡한 집계를 프론트에서 처리

---

## 2. 아키텍처 개선 방향

### 2.1 백엔드 — API 계층 분리

**목표:** 사용자/관리자 API를 명확히 분리 + 일관된 응답 구조

```
/api/v1/
├── users/                    ← 사용자 인증, 정보 관리
│   ├── POST   /signup
│   ├── POST   /login
│   ├── GET    /me
│   └── PUT    /me
├── accounts/                 ← 사용자 계좌 관리
│   ├── GET    /me          (내 계좌 목록)
│   ├── POST   /
│   ├── DELETE /{id}
│   └── PATCH  /{id}/main
├── transactions/             ← 사용자 거래 내역
│   ├── GET    /me          (내 거래 목록)
│   ├── POST   /transfer
│   └── GET    /{id}
├── dashboard/                ← 사용자 대시보드 (신규, 집계 포함)
│   └── GET    /             (종합 대시보드 데이터)
├── admin/                    ← 관리자 기능 (기존 유지)
│   ├── users/
│   ├── transactions/
│   ├── transfer-limits/
│   ├── error-logs/
│   └── dashboard/            (관리자 대시보드)
└── notifications/            ← 알림 (공통)
    └── GET   /me
```

**API 응답 통일:**
```java
// CommonResponse.java (기존 유지)
{
  "status": "success",
  "message": "...",
  "data": {...}
}
```

### 2.2 백엔드 — 응답 DTO 표준화

**원칙:** 엔티티 직렬화 금지 → 항상 DTO 변환

```
Entity Layer          Service Layer      Controller
┌──────────┐         ┌───────────┐      ┌─────────┐
│ User     │────────→│ UserInfo  │─────→│ API     │
│ Accounts │         │ DTO       │      │Response │
│ Transaction────────┤ ...       │      └─────────┘
└──────────┘         └───────────┘
```

**DTO 전략:**
```java
// 최상위 DTO (재사용성)
├── response/
│   ├── AccountSummary.java          ← 계좌 요약 (상대 정보 포함)
│   ├── TransactionResponse.java      ← 거래 응답 (상대방 이름 포함)
│   ├── UserResponse.java
│   └── dashboard/
│       ├── UserDashboardResponse.java  ← 사용자 대시보드 (신규)
│       ├── FrequentRecipient.java      ← 자주 보내는 친구
│       ├── MonthlyStats.java           ← 월간 통계
│       └── AssetTrendData.java         ← 자산 추이
│   └── admin/
│       ├── AdminDashboardResponse.java ← 관리자 대시보드 (기존)
│       ├── UserManagementDTO.java
│       └── ...
```

### 2.3 백엔드 — 거래 데이터 구조 개선

**현재 문제:**
- `Transaction.receiverAccount` → `Accounts` → `User` (미노출)
- 거래 상세 정보 부족 (카테고리, 메모 등)

**개선:**
```java
// TransactionResponse (신규)
{
  transactionId: long,
  amount: decimal,
  status: enum,
  transactionDate: timestamp,
  
  // 송신자 정보
  sender: {
    accountId: long,
    accountNumber: string,
    bankName: string,
    accountName: string,
    ownerName: string  // ← 핵심: 상대방 이름
  },
  
  // 수신자 정보
  receiver: {
    accountId: long,
    accountNumber: string,
    bankName: string,
    accountName: string,
    ownerName: string
  },
  
  // 거래 메타데이터
  category: string,     // "식비", "교통" 등
  memo: string,
  description: string
}
```

### 2.4 백엔드 — 집계 처리 이전

**현재:** 프론트에서 raw 거래 → 자산 추이, 월간 통계 계산  
**목표:** 백엔드에서 집계 후 응답

**신규 엔드포인트:**
```
GET /api/v1/dashboard

응답:
{
  user: UserInfo,
  accounts: [Account],
  monthlyStats: {
    totalSent: decimal,
    totalReceived: decimal,
    transactionCount: int,
    averageAmount: decimal
  },
  assetTrendData: [
    { month: "1월", balance: 5000000 },
    ...
  ],
  monthlyExpenseData: [
    { month: "1월", amount: 300000 },
    ...
  ],
  frequentRecipients: [
    { userId, name, accountId, accountNumber, bankName, accountName, transferCount },
    ...
  ],
  recentTransactions: [TransactionResponse]
}
```

---

## 3. 프론트엔드 개선 방향

### 3.1 레이아웃 분리

**목표:** 사용자/관리자 레이아웃을 별도 컴포넌트로 분리

```
components/
├── layouts/
│   ├── UserLayout.tsx        ← 사용자 레이아웃 (사이드바, 헤더)
│   └── AdminLayout.tsx       ← 관리자 레이아웃 (다른 스타일)
```

**UserLayout:**
```
┌─ Sidebar(로고, 메뉴) ─┬─ Header(제목, 알림) ─────────────┐
│                      │                                   │
│ 대시보드             │ ┌─────────────────────────────────┤
│ 내 계좌             │ │ Main Content (라우팅)          │
│ 송금하기            │ │                                 │
│ 친구                │ │                                 │
│ 거래 내역           │ │                                 │
│ 알림                │ │                                 │
│ 설정                │ │                                 │
│ ────────            │ │                                 │
│ 로그아웃            │ │                                 │
└────────────────────┴─└─────────────────────────────────┘
```

### 3.2 Dashboard 컴포넌트 세분화

**현재:** Dashboard.tsx (650+ 줄) — 모든 로직 포함  
**개선:** 작은 컴포넌트로 분리

```
pages/
└── Dashboard.tsx
    └── components/
        ├── HeroCard.tsx              ← 총 자산 + 대표 계좌 + 액션 버튼
        ├── FrequentRecipients.tsx    ← 자주 보내는 친구
        ├── MonthlyStats.tsx          ← 이달의 통계
        ├── AssetTrendChart.tsx       ← 자산 추이 차트
        ├── MonthlyExpenseChart.tsx   ← 월별 지출 차트
        └── RecentTransactions.tsx    ← 최근 거래
```

**이점:**
- 각 컴포넌트 단일 책임
- 재사용성 높음
- 테스트 용이
- 유지보수 쉬움

### 3.3 API 호출 레이어 분리

**목표:** API 로직을 별도 모듈로 분리 → 재사용성, 테스트성 향상

```
api/
├── users/
│   └── UserAPI.ts          (기존 유지)
├── accounts/
│   └── AccountAPI.ts       (기존 유지)
├── transactions/
│   └── TransactionAPI.ts   (신규)
├── dashboard/
│   └── DashboardAPI.ts     (신규 — dashboard 집계 데이터)
└── admin/
    └── AdminAPI.ts         (기존 유지)
```

**DashboardAPI 예:**
```typescript
// api/dashboard/DashboardAPI.ts (신규)
export const getDashboard = async (): Promise<UserDashboardResponse> => {
  const res = await api.get("/dashboard");
  return res.data;
};
```

### 3.4 타입 정의 개선

**목표:** 백엔드 응답과 프론트 타입을 정확히 매칭

```typescript
// types/dashboard.ts (신규)
export interface UserDashboardResponse {
  user: UserInfo;
  accounts: Account[];
  monthlyStats: MonthlyStats;
  assetTrendData: AssetTrendData[];
  monthlyExpenseData: MonthlyExpenseData[];
  frequentRecipients: FrequentRecipient[];
  recentTransactions: TransactionResponse[];
}

export interface TransactionResponse {
  transactionId: number;
  amount: number;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  transactionDate: string;
  sender: AccountSummary;
  receiver: AccountSummary;
  category: string;
  memo: string;
}

export interface AccountSummary {
  accountId: number;
  accountNumber: string;
  bankName: string;
  accountName: string;
  ownerName: string;  // ← 핵심
  balance: number;
}
```

### 3.5 상태 관리 최적화

**현재:** 각 컴포넌트에서 `useState` + `useEffect`로 API 호출  
**개선:** 커스텀 훅으로 집중화

```typescript
// hooks/useDashboard.ts (신규)
export const useDashboard = () => {
  const [dashboard, setDashboard] = useState<UserDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await getDashboard();
        setDashboard(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  return { dashboard, isLoading, error };
};
```

**Dashboard.tsx 에서 사용:**
```typescript
const Dashboard: React.FC = () => {
  const { dashboard, isLoading } = useDashboard();

  if (isLoading) return <Skeleton />;

  return (
    <UserLayout>
      <HeroCard account={dashboard.accounts[0]} />
      <FrequentRecipients recipients={dashboard.frequentRecipients} />
      {/* ... */}
    </UserLayout>
  );
};
```

---

## 4. 구현 로드맵

### Phase 1 — 백엔드 기초 (Week 1)
```
[ ] Step B1: TransactionResponse DTO 생성 + 상대방 이름 노출
[ ] Step B2: 전체 계좌 거래 조회 API (getRecentTransactionsByAccounts)
[ ] Step B3: 자주 보내는 친구 쿼리 구현
[ ] Step B4: Dashboard API 통합 (모든 집계 데이터 포함)
[ ] Step B5: accountName 필드 추가 (데이터 마이그레이션)
```

### Phase 2 — 프론트엔드 기초 (Week 1 병행)
```
[ ] Step F1: UserLayout 컴포넌트 생성
[ ] Step F2: DashboardAPI 모듈 작성
[ ] Step F3: useDashboard 커스텀 훅
[ ] Step F4: 타입 정의 (dashboard.ts)
[ ] Step F5: Dashboard 세분화 (HeroCard, FrequentRecipients 등)
```

### Phase 3 — Dashboard UI 개편 (Week 2)
```
[ ] Step F6: HeroCard 구현 (액션 버튼 4개)
[ ] Step F7: FrequentRecipients 컴포넌트
[ ] Step F8: 레이아웃 재배치 (좌/우 컬럼)
[ ] Step F9: 차트 데이터 연결
[ ] Step F10: 스타일 조정 + 반응형 대응
```

### Phase 4 — 검증 & 최적화 (Week 2)
```
[ ] 엔드투엔드 테스트
[ ] N+1 쿼리 검증
[ ] 성능 프로파일링
[ ] 에러 핸들링
[ ] 보안 검토
```

---

## 5. 파일 구조 변경 요약

### 백엔드 신규/변경 파일
```
backend/src/main/java/com/example/ezpay/
├── response/
│   ├── AccountSummary.java           (신규)
│   ├── TransactionResponse.java       (신규)
│   ├── DashboardResponse.java         (수정)
│   └── dashboard/
│       ├── UserDashboardResponse.java (신규)
│       ├── FrequentRecipient.java     (신규)
│       ├── MonthlyStats.java          (신규)
│       └── AssetTrendData.java        (신규)
├── controller/user/
│   └── DashboardController.java       (수정)
├── modules/analytics/
│   └── internal/service/
│       └── DashboardServiceImpl.java   (수정 — 집계 로직)
└── repository/user/
    └── impl/
        └── TransactionRepositoryImpl.java  (수정 — 신규 쿼리)
```

### 프론트엔드 신규/변경 파일
```
frontend/src/
├── api/
│   ├── dashboard/
│   │   └── DashboardAPI.ts           (신규)
│   └── ...
├── hooks/
│   └── useDashboard.ts               (신규)
├── types/
│   └── dashboard.ts                  (신규)
├── components/
│   ├── layouts/
│   │   └── UserLayout.tsx            (신규)
│   └── ...
├── pages/
│   └── Dashboard.tsx                 (수정 — 세분화)
│       └── components/
│           ├── HeroCard.tsx          (신규)
│           ├── FrequentRecipients.tsx (신규)
│           ├── MonthlyStats.tsx      (신규)
│           ├── AssetTrendChart.tsx   (신규)
│           ├── MonthlyExpenseChart.tsx (신규)
│           └── RecentTransactions.tsx (신규)
```

---

## 6. 우선순위 및 의존성

```
Backend Phase 1 (B1~B4) ────→ Frontend Phase 2 (F1~F4)
                       ↓                        ↓
                   Phase 3 (F5~F10)  ←─ Phase 3 검증
                       ↓
                   Phase 4 최적화
```

**핵심 경로:**
1. B1 (TransactionResponse) — F1, F2 병행 가능
2. B4 (Dashboard API) 완성 → F3~F10 진행

---

## 7. 주의사항

### 7.1 데이터베이스
- `accountName` 추가 시 기존 계좌 마이그레이션 필요
- `data.sql`에서 `bankName` → `accountName` 매핑

### 7.2 호환성
- 기존 모바일 앱이 있다면 API 버전 관리 고려
- 점진적 롤아웃: 신규 endpoint 추가 → 레거시 endpoint 계속 지원

### 7.3 성능
- `fetchJoin()` 사용으로 N+1 해결
- 대시보드 API 응답이 무거울 수 있음 → 캐싱 고려
- 자주 보내는 친구: 최근 90일로 제한 → 인덱싱 추가

### 7.4 권한
- 사용자는 자신의 데이터만 조회 가능
- `@SecurityContext`나 JWT에서 userId 추출해 검증

---

## 8. 완료 체크리스트

### 백엔드 완료 기준
- [ ] 모든 API가 `CommonResponse<T>` 래핑
- [ ] 엔티티 직렬화 금지 (모두 DTO)
- [ ] Dashboard API에서 모든 집계 데이터 제공
- [ ] 거래 응답에 상대방 이름 포함
- [ ] accountName 필드 추가 + 마이그레이션

### 프론트엔드 완료 기준
- [ ] 모든 Dashboard 컴포넌트 세분화
- [ ] useDashboard 훅으로 통합 관리
- [ ] UserLayout 적용
- [ ] 신규 UI 구현 (HeroCard, FrequentRecipients, 액션 버튼)
- [ ] 반응형 디자인 + 모바일 대응

### 테스트 완료 기준
- [ ] 대시보드 엔드투엔드 테스트
- [ ] N+1 쿼리 제거 검증
- [ ] 에러 케이스 처리
- [ ] 보안 검증 (권한 확인)
