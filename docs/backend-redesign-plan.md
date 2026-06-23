# Backend 수정 계획

프론트 디자인 변경에 따른 API 개선 사항 정리  
연관 문서: `docs/dashboard-redesign-plan.md`

---

## 현재 상태 진단

### 문제 1 — Dashboard가 대표 계좌 하나의 거래만 반환
```java
// DashboardServiceImpl.java (현재)
transactions = transactionService
    .getRecentTransactionByAccount(mainAccount.getAccountId(), "DESC", 5);
```
→ 사용자가 계좌를 여러 개 가져도 대표 계좌 5건만 조회.  
→ 프론트에서 이달의 통계, 자산 추이를 계산할 데이터가 부족함.

### 문제 2 — 거래 응답에 상대방 이름이 없음
```java
// Transaction 엔티티 직렬화 결과
"receiverAccount": {
  "accountId": 2,
  "accountNumber": "3333-012345678",
  "bankName": "카카오뱅크",  // 은행 이름만 있고 사용자 이름 없음
  "balance": 5420000
}
```
→ `Accounts.user`는 `@JsonBackReference`로 직렬화 제외됨.  
→ "자주 보내는 친구" 섹션에서 이름 표시 불가.

### 문제 3 — Accounts에 accountName 필드 없음
```java
// Accounts 엔티티 (현재)
private String bankName;    // "토스뱅크"
// accountName 없음 — 프론트에서 accountName으로 참조 중
```

### 문제 4 — 자주 보내는 친구 API 없음
프론트 "자주 보내는 친구" 섹션을 위한 데이터 제공 API 미존재.

---

## 단계별 수정 계획

### Step 1 — Accounts 엔티티에 accountName 추가

**대상 파일:**
- `model/user/Accounts.java`
- `repository/user/AccountRepository.java`
- `request/AccountRequest.java`
- `modules/account/internal/service/AccountServiceImpl.java`

**변경 내용:**

```java
// Accounts.java — 필드 추가
@Column(nullable = false)
private String accountName;  // "입출금 통장", "저축 통장" 등
```

계좌 개설 시 `accountName`을 입력받도록 `AccountRequest`와 서비스 레이어 수정.  
기존 데이터는 `bankName` 값으로 마이그레이션 또는 `data.sql` 업데이트.

---

### Step 2 — TransactionResponse DTO 생성 (상대방 이름 노출)

**현재 문제:** `Transaction` 엔티티를 직렬화하면 `Accounts.user`는 `@JsonBackReference`로 제외됨.  
**해결:** 엔티티 직접 반환 대신 응답 전용 DTO 생성.

**새로 만들 파일:**
```
response/
└── TransactionResponse.java     ← 신규 생성
response/
└── AccountSummary.java          ← 신규 생성 (거래용 계좌 요약)
```

```java
// AccountSummary.java
public class AccountSummary {
    private Long accountId;
    private String accountNumber;
    private String bankName;
    private String accountName;
    private BigDecimal balance;
    private String ownerName;    // ← 핵심 추가 — User.name
}

// TransactionResponse.java
public class TransactionResponse {
    private Long transactionId;
    private AccountSummary senderAccount;
    private AccountSummary receiverAccount;
    private BigDecimal amount;
    private TransactionStatus status;
    private Timestamp transactionDate;
    private String description;
    private String category;
    private String memo;
}
```

**수정할 파일:**
- `response/DashboardResponse.java` — `List<Transaction>` → `List<TransactionResponse>`
- `modules/analytics/internal/service/DashboardServiceImpl.java` — 매핑 로직 추가
- `controller/user/DashboardController.java` — 반환 타입 변경
- `controller/user/TransactionController.java` — 거래 내역 조회도 동일 DTO 사용

**매핑 예시:**
```java
// DashboardServiceImpl — Transaction → TransactionResponse 변환
private TransactionResponse toResponse(Transaction tx) {
    return TransactionResponse.builder()
        .transactionId(tx.getTransactionId())
        .senderAccount(toAccountSummary(tx.getSenderAccount()))
        .receiverAccount(toAccountSummary(tx.getReceiverAccount()))
        ...build();
}

private AccountSummary toAccountSummary(Accounts account) {
    return AccountSummary.builder()
        .accountId(account.getAccountId())
        .bankName(account.getBankName())
        .ownerName(account.getUser().getName())  // ← 이름 노출
        ...build();
}
```

> **주의:** `account.getUser()`가 LAZY 로딩이므로 트랜잭션 내에서 호출하거나  
> QueryDSL에서 `fetchJoin()`으로 함께 조회해야 N+1 문제 방지.

---

### Step 3 — Dashboard 거래 내역 전체 계좌 조회로 확장

**대상 파일:** `modules/analytics/internal/service/DashboardServiceImpl.java`

**현재:**
```java
// 대표 계좌 1개의 최근 5건만 조회
transactions = transactionService
    .getRecentTransactionByAccount(mainAccount.getAccountId(), "DESC", 5);
```

**목표:**
```java
// 사용자의 모든 계좌 ID 추출
List<Long> accountIds = accounts.stream()
    .map(Accounts::getAccountId)
    .collect(Collectors.toList());

// 전체 계좌 통합 최근 N건 조회
List<Transaction> transactions =
    transactionService.getRecentTransactionsByAccounts(accountIds, "DESC", 20);
```

**새로 추가할 쿼리** (`TransactionRepositoryImpl.java`):
```java
// 여러 계좌 ID를 IN 절로 조회, 날짜 내림차순 정렬, limit 적용
public List<Transaction> findRecentByAccountIds(
        List<Long> accountIds, int limit) {
    return queryFactory
        .selectFrom(transaction)
        .join(transaction.senderAccount, senderAccount).fetchJoin()
        .join(senderAccount.user, senderUser).fetchJoin()
        .join(transaction.receiverAccount, receiverAccount).fetchJoin()
        .join(receiverAccount.user, receiverUser).fetchJoin()
        .where(senderAccount.accountId.in(accountIds)
            .or(receiverAccount.accountId.in(accountIds)))
        .orderBy(transaction.transactionDate.desc())
        .limit(limit)
        .fetch();
}
```

**수정 파일:**
- `repository/queryDSL/TransactionRepositoryCustom.java` — 인터페이스 메서드 추가
- `repository/user/impl/TransactionRepositoryImpl.java` — 구현 추가
- `modules/payment/internal/service/TransactionServiceImpl.java` — 서비스 메서드 추가
- `modules/analytics/internal/service/DashboardServiceImpl.java` — 호출부 변경

---

### Step 4 — 자주 보내는 친구 API 추가

**목적:** "자주 보내는 친구" 섹션 — 최근 90일 내 가장 많이 송금한 수신자 상위 N명

**방법 A: Dashboard 응답에 포함 (권장)**
`DashboardResponse`에 `frequentRecipients` 필드를 추가하여 한 번의 API 호출로 처리.

**방법 B: 별도 엔드포인트**
`GET /dashboard/frequent-recipients` — 프론트에서 별도 호출.

→ **방법 A 선택** (API 호출 수 최소화, 대시보드 진입 시 한 번에 로딩)

**새로 만들 파일:**
```
response/
└── FrequentRecipientResponse.java   ← 신규 생성
```

```java
// FrequentRecipientResponse.java
public class FrequentRecipientResponse {
    private Long userId;
    private String name;           // 수신자 이름
    private Long accountId;        // 수신 계좌 ID
    private String accountNumber;  // 마스킹 표시용
    private String bankName;
    private int transferCount;     // 최근 90일 송금 횟수
}
```

**새로 추가할 쿼리** (`TransactionRepositoryImpl.java`):
```java
// 최근 90일, 현재 사용자가 송신자인 거래에서
// 수신자(receiverAccount.user)별 건수를 집계 → 상위 N명
public List<FrequentRecipientResponse> findFrequentRecipients(
        Long userId, Timestamp since, int limit) {

    return queryFactory
        .select(Projections.constructor(FrequentRecipientResponse.class,
            receiverUser.userId,
            receiverUser.name,
            receiverAccount.accountId,
            receiverAccount.accountNumber,
            receiverAccount.bankName,
            transaction.count()
        ))
        .from(transaction)
        .join(transaction.senderAccount, senderAccount)
        .join(senderAccount.user, senderUser)
        .join(transaction.receiverAccount, receiverAccount)
        .join(receiverAccount.user, receiverUser)
        .where(senderUser.userId.eq(userId)
            .and(transaction.status.eq(TransactionStatus.SUCCESS))
            .and(transaction.transactionDate.goe(since))
            .and(senderUser.userId.ne(receiverUser.userId))) // 자기 자신 제외
        .groupBy(receiverUser.userId, receiverAccount.accountId)
        .orderBy(transaction.count().desc())
        .limit(limit)
        .fetch();
}
```

**수정 파일:**
- `response/DashboardResponse.java` — `frequentRecipients` 필드 추가
- `repository/queryDSL/TransactionRepositoryCustom.java` — 메서드 추가
- `repository/user/impl/TransactionRepositoryImpl.java` — 구현 추가
- `modules/analytics/internal/service/DashboardServiceImpl.java` — 집계 후 응답에 포함

---

### Step 5 — 월간 통계 서버 계산 추가 (선택)

현재는 프론트에서 raw 거래 데이터를 받아 직접 계산 중.  
데이터가 많아지면 네트워크 부하 증가 → 서버 계산으로 전환 권장.

**새로 만들 파일:**
```
response/
└── MonthlyStatsResponse.java   ← 신규 생성
```

```java
// MonthlyStatsResponse.java
public class MonthlyStatsResponse {
    private BigDecimal totalSent;
    private BigDecimal totalReceived;
    private int transactionCount;
    private BigDecimal averageAmount;
}
```

**수정 파일:**
- `response/DashboardResponse.java` — `monthlyStats` 필드 추가
- `repository/user/TransactionRepository.java` — 월간 집계 쿼리 추가
- `modules/analytics/internal/service/DashboardServiceImpl.java` — 계산 로직 추가

> Step 5는 우선순위 낮음. Step 1~4 완료 후 진행.

---

## 최종 DashboardResponse 목표 구조

```java
@Data @Builder
public class DashboardResponse {
    private UserInfo user;
    private List<Accounts> account;                          // 기존 유지
    private List<TransactionResponse> transactions;          // Step 2 — DTO 변환
    private List<FrequentRecipientResponse> frequentRecipients; // Step 4 — 신규
    private MonthlyStatsResponse monthlyStats;               // Step 5 — 선택
}
```

---

## 수정 파일 전체 요약

| 파일 | 변경 유형 | 단계 |
|------|-----------|------|
| `model/user/Accounts.java` | accountName 필드 추가 | Step 1 |
| `request/AccountRequest.java` | accountName 필드 추가 | Step 1 |
| `modules/account/internal/service/AccountServiceImpl.java` | accountName 저장 | Step 1 |
| `response/AccountSummary.java` | **신규 생성** | Step 2 |
| `response/TransactionResponse.java` | **신규 생성** | Step 2 |
| `response/DashboardResponse.java` | 필드 교체 및 추가 | Step 2, 4, 5 |
| `controller/user/DashboardController.java` | 반환 타입 변경 | Step 2 |
| `controller/user/TransactionController.java` | DTO 적용 | Step 2 |
| `repository/queryDSL/TransactionRepositoryCustom.java` | 메서드 추가 | Step 3, 4 |
| `repository/user/impl/TransactionRepositoryImpl.java` | 쿼리 구현 추가 | Step 3, 4 |
| `modules/payment/internal/service/TransactionServiceImpl.java` | 메서드 추가 | Step 3 |
| `modules/analytics/internal/service/DashboardServiceImpl.java` | 핵심 로직 변경 | Step 2, 3, 4, 5 |
| `response/FrequentRecipientResponse.java` | **신규 생성** | Step 4 |
| `response/MonthlyStatsResponse.java` | **신규 생성** | Step 5 |

---

## 작업 우선순위

```
Step 2 (TransactionResponse DTO)  ← 가장 먼저 — 이름 노출이 핵심
Step 3 (전체 계좌 거래 조회)     ← 통계 정확도에 필수
Step 4 (자주 보내는 친구)        ← 신규 UI 기능
Step 1 (accountName)              ← 계좌 개설 흐름 변경 필요
Step 5 (월간 통계 서버 계산)      ← 선택, 나중에
```
