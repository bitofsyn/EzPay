import { type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell } from "lucide-react";
import UserSidebar from "./UserSidebar";
import { navigateToAdminDashboard } from "../utils/adminView";

const todayLabel = new Date().toLocaleDateString("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

type UserShellProps = {
  /** 헤더 제목 */
  title: string;
  /** 제목 아래 보조 문구 (미지정 시 `EzPay · 오늘 날짜`) */
  subtitle?: string;
  /** 지정 시 제목 왼쪽에 뒤로가기 버튼 노출 */
  backTo?: string;
  /** 헤더 우측(알림 벨 앞)에 배치할 추가 액션 */
  actions?: ReactNode;
  /** 사용자 뷰 / 관리자 뷰 토글 노출 여부 */
  showViewToggle?: boolean;
  /** 사이드바 · 알림 벨 뱃지에 표시할 미확인 알림 수 */
  unreadCount?: number;
  children: ReactNode;
};

/**
 * 사용자 화면 공통 레이아웃.
 * 관리자(AdminShell)와 동일한 풀블리드 · 플랫 구조 위에, 화면에 밀착된 전체 높이
 * 흰색 사이드바 + 플랫 헤더를 배치한다. 반응형(모바일 상단 바/드로어)은 UserSidebar가 담당.
 */
const UserShell = ({
  title,
  subtitle,
  backTo,
  actions,
  showViewToggle = false,
  unreadCount = 0,
  children,
}: UserShellProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[240px_minmax(0,1fr)]">
        <UserSidebar unreadCount={unreadCount} />

        <div className="flex min-w-0 flex-col">
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-3">
                {backTo && (
                  <button
                    type="button"
                    onClick={() => navigate(backTo)}
                    aria-label="뒤로 가기"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                  >
                    <ArrowLeft size={18} />
                  </button>
                )}
                <div className="min-w-0">
                  <h1 className="text-[22px] font-black tracking-tight text-slate-950">{title}</h1>
                  <p className="mt-1 text-sm font-medium text-slate-400">
                    {subtitle ?? `EzPay · ${todayLabel}`}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {actions}

                {showViewToggle && (
                  <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 text-sm font-semibold">
                    <button
                      type="button"
                      className="rounded-full bg-slate-950 px-5 py-2 text-white shadow-sm"
                    >
                      사용자 뷰
                    </button>
                    <button
                      type="button"
                      className="rounded-full px-5 py-2 text-slate-600 transition hover:text-slate-900"
                      onClick={() => navigateToAdminDashboard(navigate)}
                    >
                      관리자 뷰
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => navigate("/notifications")}
                  aria-label="알림"
                  className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-slate-300 hover:bg-white hover:text-slate-900"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </header>

          <main className="flex flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto flex w-full max-w-[1240px] flex-1 flex-col gap-5">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default UserShell;
