/**
 * 대시보드 프레젠테이션 계층 뷰모델 타입.
 *
 * API 타입(`src/types`)과 UI 컴포넌트를 분리하기 위한 얇은 뷰모델이다.
 * 컨테이너(`Dashboard.tsx`)가 API 응답 → 이 뷰모델로 변환해 각 카드에 주입하며,
 * 향후 MSA/Kafka 실시간 이벤트가 들어와도 컴포넌트는 그대로 재사용된다.
 */

/** 히어로 카드에 노출할 대표 계좌 요약 */
export interface HeroAccount {
  bankName: string;
  /** 마스킹된 계좌번호 (예: 1002-****-8901) */
  maskedNumber: string;
  balance: number;
}

/** 퀵 액션 버튼 정의 */
export interface QuickAction {
  key: string;
  label: string;
  /** 이모지/문자 아이콘 또는 렌더 노드 */
  icon: React.ReactNode;
  onClick?: () => void;
}

/** 거래 방향 */
export type TxDirection = "in" | "out";

/** 최근 거래 리스트 항목 */
export interface RecentTx {
  id: string | number;
  /** 거래 상대 표시명 */
  counterparty: string;
  category?: string;
  /** 사람이 읽는 날짜 문자열 (예: "6월 21일 14:30") */
  dateLabel: string;
  amount: number;
  direction: TxDirection;
}

/** 자주 보내는 친구 */
export interface FriendChip {
  id: string | number;
  name: string;
  /** 표시용 별칭 (없으면 name) */
  alias?: string;
  favorite?: boolean;
}

/** 이달의 통계 항목 */
export interface StatItem {
  label: string;
  value: string;
}

/** 차트 단일 데이터 포인트 */
export interface ChartPoint {
  label: string;
  value: number;
  /** 막대 차트에서 개별 색 지정 시 사용 */
  color?: string;
}

/** 월간 예산 항목 */
export interface BudgetItem {
  category: string;
  used: number;
  limit: number;
  /** 진행바 색 (기본 slate, 초과 임박 시 amber 등) */
  color?: string;
}
