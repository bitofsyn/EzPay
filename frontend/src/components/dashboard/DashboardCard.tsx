import { type ReactNode } from "react";

interface DashboardCardProps {
  /** 카드 상단 제목 (없으면 헤더 미노출) */
  title?: ReactNode;
  /** 제목 우측 액션/뱃지 영역 */
  action?: ReactNode;
  /** hover 시 살짝 떠오르는 인터랙션 부여 */
  interactive?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * 대시보드 흰색 카드 공통 래퍼.
 * 원본 목업의 카드 스타일(radius 16 · padding 18 · soft shadow)을 Tailwind로 재현하고,
 * hover lift/transition 같은 세부 인터랙션을 한 곳에서 관리한다.
 */
const DashboardCard = ({ title, action, interactive = false, className = "", children }: DashboardCardProps) => (
  <section
    className={[
      "rounded-2xl border border-slate-100 bg-white p-5 shadow-sm",
      "transition duration-300 ease-out",
      interactive ? "hover:-translate-y-0.5 hover:shadow-md" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ")}
  >
    {(title || action) && (
      <div className="mb-4 flex items-center justify-between gap-3">
        {title ? <h2 className="text-base font-bold text-slate-800">{title}</h2> : <span />}
        {action}
      </div>
    )}
    {children}
  </section>
);

export default DashboardCard;
