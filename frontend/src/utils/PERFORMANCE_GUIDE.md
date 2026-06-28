# 성능 최적화 가이드

## 개요
EzPay 대시보드는 실시간 데이터를 처리하는 대규모 애플리케이션입니다. 
이 문서는 성능 최적화를 위한 패턴과 모범 사례를 정의합니다.

---

## 1. React.memo (컴포넌트 메모이제이션)

### 목적
- Props가 변경되지 않으면 리렌더링 스킵
- 특히 리스트 아이템이나 카드 컴포넌트에 효과적

### 적용 대상
- ✅ `MetricCard` - 카드 컴포넌트
- ✅ `SystemLogList` - 로그 리스트
- ✅ `TransactionList` - 거래 리스트
- ✅ `RiskTransactionCard` - 위험 거래 카드

### 예제
```typescript
const MetricCard = memo(({ label, value, color }) => {
  return <div>...</div>;
});
```

### 커스텀 비교 함수
특정 prop만 비교할 필요가 있을 때 사용:

```typescript
const SystemLogList = memo(
  ({ logs, isLoading }) => {...},
  (prevProps, nextProps) => {
    // true를 반환하면 리렌더링 스킵
    return prevProps.logs === nextProps.logs && 
           prevProps.isLoading === nextProps.isLoading;
  }
);
```

---

## 2. useCallback (이벤트 핸들러 메모이제이션)

### 목적
- 함수 참조 안정화
- 하위 컴포넌트의 memo 효율성 증대
- 의존성 배열 최소화

### 사용 패턴
```typescript
const handleDelete = useCallback((id: number) => {
  // 핸들러 로직
  onDeleteTransaction?.(id);
}, [onDeleteTransaction]); // onDeleteTransaction만 의존
```

### 주의사항
- 의존성 배열을 정확히 지정
- 너무 많은 의존성은 memo의 효과를 감소

---

## 3. useMemo (계산 결과 메모이제이션)

### 목적
- 비용이 큰 계산 결과 캐싱
- 배열/객체 참조 안정화

### 적용 사례

#### 3-1. 테이블 컬럼 정의 메모이제이션
```typescript
const columns: TableColumn<Transaction>[] = useMemo(() => [
  { key: "transactionId", label: "거래 ID", ... },
  { key: "amount", label: "금액", ... },
  // ...
], []); // 의존성 없음 - 한 번만 생성
```

#### 3-2. 필터링된 데이터 메모이제이션
```typescript
const memoizedLogs = useMemo(() => logs, [logs]);
// logs가 같으면 같은 참조 유지 → memo 비교 성공
```

#### 3-3. 계산 로직 메모이제이션
```typescript
const dangerCount = useMemo(
  () => INITIAL_RISKS.filter((r) => r.level === "위험").length,
  [] // 한 번만 계산
);
```

---

## 4. 가상화 (Virtualization) 고려사항

### 언제 필요한가?
- 데이터가 **1000개 이상**일 때
- 각 행이 **복잡한 UI**를 가질 때

### 현재 상태
- ❌ `SystemLogList`: 30-50개 정도 → 아직 불필요
- ❌ `TransactionList`: 페이징 사용 → 아직 불필요
- ⏳ `RealtimeTransactionLog`: 50개 유지 → 추후 검토

### 도입 시 라이브러리
```bash
npm install react-window react-virtuoso
```

### 사용 예제 (향후)
```typescript
import { FixedSizeList } from "react-window";

<FixedSizeList
  height={600}
  itemCount={logs.length}
  itemSize={35}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>{logs[index]}</div>
  )}
</FixedSizeList>
```

---

## 5. 모니터링 및 측정

### Chrome DevTools - React Profiler
1. 우측 상단 "Profiler" 탭 클릭
2. 녹음 시작 → 상호작용 수행 → 녹음 중지
3. 리렌더링 횟수 및 소요 시간 확인

### 확인 체크리스트
- [ ] 불필요한 리렌더링이 없는가?
- [ ] 각 컴포넌트 렌더링 시간은 < 16ms인가?
- [ ] memo 적용 후 리렌더링이 감소했는가?

### 성능 목표
- **FCP (First Contentful Paint)**: < 1.5s
- **LCP (Largest Contentful Paint)**: < 2.5s
- **CLS (Cumulative Layout Shift)**: < 0.1
- **TTFB (Time to First Byte)**: < 600ms

---

## 6. 일반 최적화 팁

### ✅ DO
- 큰 객체는 상위 컴포넌트에서 생성 후 props로 전달
- 필요한 데이터만 props로 전달
- 의존성 배열을 최소화
- 컴포넌트를 작고 단일 책임으로 분리

### ❌ DON'T
- 렌더 함수 내에서 새 객체/배열 생성
- useCallback/useMemo 남용 (오버헤드 발생)
- 모든 props를 한 객체로 전달 (비교 시간 증가)
- 깊은 의존성 체인 형성

---

## 7. 단계별 최적화 로드맵

### Phase 1: 기본 메모이제이션 ✅
- React.memo 적용 완료
- useCallback 적용 완료
- useMemo 적용 완료

### Phase 2: 상태 관리 최적화 (예정)
- Redux/Context API 분리 고려
- 상태 업데이트 배치 처리

### Phase 3: 코드 분할 (Code Splitting)
- 라우트별 동적 import
- 무거운 컴포넌트 lazy loading

### Phase 4: 가상화 도입 (필요시)
- 1000+ 아이템 리스트 가상화
- 무한 스크롤 구현

---

## 참고 자료
- [React.memo 공식 문서](https://react.dev/reference/react/memo)
- [useCallback 공식 문서](https://react.dev/reference/react/useCallback)
- [useMemo 공식 문서](https://react.dev/reference/react/useMemo)
- [Web Vitals](https://web.dev/vitals/)
