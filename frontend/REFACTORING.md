# 프론트엔드 리팩토링 가이드

## 완료된 작업

### 1. 중복 코드 유틸리티로 추출 

#### 생성된 유틸리티 파일들:

- **`src/utils/errorHandler.ts`**: API 에러 처리 통합
  - `handleApiError()`: 일반 API 에러 처리
  - `handleTransferError()`: 송금 관련 에러 처리

- **`src/utils/formatters.ts`**: 포맷팅 함수들
  - `formatAccountNumber()`: 계좌번호 포맷팅 (XX-XXXX-XXXXXX)
  - `formatAmount()`: 금액 3자리 콤마 포맷팅
  - `formatCurrency()`: 금액 + "원" 포맷팅
  - `formatDate()`: 날짜 로케일 포맷팅
  - `getRelativeTime()`: 상대 시간 ("방금 전", "5분 전")
  - `formatActivityDescription()`: 활동 설명 포맷팅
  - `getActivityColor()`: 활동 타입별 색상 결정

- **`src/utils/storage.ts`**: localStorage/sessionStorage 헬퍼
  - `saveUserData()`: 사용자 데이터 저장
  - `getUserData()`: 사용자 데이터 가져오기
  - `clearUserData()`: 사용자 데이터 삭제 (로그아웃)
  - `saveToken()`: 토큰 저장
  - `getToken()`: 토큰 가져오기

- **`src/utils/constants.ts`**: 전역 상수
  - `TRANSACTION_CATEGORIES`: 거래 카테고리 목록
  - `COMMON_STYLES`: 공통 스타일 클래스
  - `ERROR_MESSAGES`: 에러 메시지 상수

#### 리팩토링된 파일들:
- `Login.tsx`: 에러 핸들링, 스토리지 사용 개선
- `Dashboard.js`: 포맷팅 함수, 스토리지 사용 개선
- `SendMoney.js`: 에러 핸들링, 상수 사용
- `Signup.js`: 에러 핸들링 개선
- Admin 페이지들: `adminUtils.js` → `formatters.ts` 마이그레이션

---

### 2. 접근성 개선 (ARIA, 키보드 네비게이션) ✅

#### Button 컴포넌트 (`src/components/Button.tsx`)
- `aria-label` 지원 추가
- `aria-describedby` 지원 추가
- `aria-disabled` 상태 추가
- Focus 스타일 개선 (`focus:ring-2`)

#### Input 컴포넌트 (`src/components/Input.tsx`)
- `label`과 `input` 자동 연결 (`htmlFor`/`id`)
- 에러 메시지에 `role="alert"` 추가
- `aria-required`, `aria-invalid`, `aria-describedby` 추가
- 에러 상태 시각적 표시 (빨간 테두리)
- 필수 필드 표시 (`*`)

#### Login 페이지 (`src/pages/Login.tsx`)
- 모든 input에 `id`와 `label` 연결
- 에러 메시지에 `role="alert"`, `aria-live="polite"` 추가
- 폼 검증 에러에 `aria-invalid`, `aria-describedby` 추가
- 버튼에 동적 `aria-label` 추가

---

### 3. 테스트 작성 시작 

#### 생성된 테스트 파일들:

- **`src/components/__tests__/Button.test.tsx`**
  - 렌더링 테스트
  - 클릭 이벤트 테스트
  - disabled 상태 테스트
  - aria-label 테스트
  - Focus 스타일 테스트

- **`src/components/__tests__/Input.test.tsx`**
  - Label 연결 테스트
  - 에러 메시지 표시 테스트
  - Required 필드 테스트
  - aria-invalid 테스트
  - onChange 이벤트 테스트
  - Disabled 상태 테스트

- **`src/utils/__tests__/formatters.test.ts`**
  - formatAccountNumber() 테스트
  - formatAmount() 테스트
  - formatCurrency() 테스트
  - getRelativeTime() 테스트

#### 테스트 실행:
```bash
npm test
```

---

### 4. i18n 지원 구현 

#### 설정 파일:
- **`src/i18n/config.ts`**: i18next 설정
- **`src/i18n/locales/ko.json`**: 한국어 번역
- **`src/i18n/locales/en.json`**: 영어 번역
- **`src/components/LanguageSwitcher.tsx`**: 언어 전환 컴포넌트

#### i18n 설치 및 설정:

1. **패키지 설치**:
```bash
npm install react-i18next i18next --legacy-peer-deps
```

2. **App.tsx에 i18n 추가**:
```typescript
import './i18n/config'; // 최상단에 추가

function App() {
  // ...
}
```

3. **사용 예시** (Login 페이지):
```typescript
import { useTranslation } from 'react-i18next';

const Login = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h2>{t('common.login')}</h2>
      <label>{t('auth.email')}</label>
      <input placeholder={t('auth.emailPlaceholder')} />
      <button>{t('common.login')}</button>
    </div>
  );
};
```

4. **언어 전환 컴포넌트 사용**:
```typescript
import LanguageSwitcher from '../components/LanguageSwitcher';

// Header나 Dashboard에 추가
<LanguageSwitcher />
```

---

## 사용 가이드

### 유틸리티 함수 사용:

```typescript
import { handleApiError } from '../utils/errorHandler';
import { formatCurrency, formatAccountNumber } from '../utils/formatters';
import { saveUserData, clearUserData } from '../utils/storage';

// 에러 처리
try {
  const res = await apiCall();
} catch (err) {
  setError(handleApiError(err));
}

// 포맷팅
const formatted = formatAccountNumber('1234567890'); // "12-3456-7890"
const amount = formatCurrency(10000); // "10,000 원"

// 스토리지
saveUserData(userData, keepLogin);
clearUserData(); // 로그아웃
```

### 접근성이 개선된 컴포넌트 사용:

```typescript
import Button from '../components/Button';
import Input from '../components/Input';

// Button 사용
<Button
  text="제출"
  onClick={handleSubmit}
  disabled={loading}
  ariaLabel="폼 제출"
/>

// Input 사용
<Input
  label="이메일"
  value={email}
  onChange={setEmail}
  error={emailError}
  required={true}
/>
```

---

## 다음 단계 (권장)

### 1. 나머지 페이지에 i18n 적용
- Dashboard, SendMoney, Signup 등 모든 페이지에 `useTranslation()` 적용
- 하드코딩된 한글 텍스트를 번역 키로 교체

### 2. 추가 테스트 작성
- 페이지 컴포넌트 통합 테스트
- API 호출 모킹 테스트
- E2E 테스트 고려 (Playwright, Cypress)

### 3. 키보드 네비게이션 확장
- 모달/사이드바에 키보드 트랩 추가
- Escape 키로 모달 닫기
- Tab 순서 최적화

### 4. 성능 최적화
- React.memo 적절히 사용
- useMemo, useCallback 최적화
- 코드 스플리팅 확장

---

## 주의사항

1. **i18n 사용 시**: 번역 파일에 모든 텍스트를 추가해야 합니다
2. **테스트 작성 시**: `@testing-library/react`의 best practices 따르기
3. **접근성**: WCAG 2.1 AA 수준 준수
4. **유틸리티 함수**: 새로운 중복 코드 발견 시 유틸리티로 추출

---

## 참고 자료

- [React i18next 문서](https://react.i18next.com/)
- [Testing Library 문서](https://testing-library.com/docs/react-testing-library/intro/)
- [WCAG 2.1 가이드라인](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
