import React, { useEffect, useMemo, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

// 페이지당 표시 건수 및 번호 페이지네이션 윈도우 크기(1,2,3,4,5)
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_PAGE_WINDOW = 5;

/**
 * 클라이언트 배열을 10개씩 잘라주는 페이지네이션 훅.
 * 검색·필터 등으로 원본 길이가 바뀌면 자동으로 유효 페이지 범위를 보정한다.
 */
export function usePagination<T>(items: T[], pageSize: number = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1);

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, pageCount);

  const paged = useMemo(
    () => items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [items, currentPage, pageSize],
  );

  // 원본 개수가 줄어 현재 페이지가 범위를 벗어나면 첫 페이지로 되돌린다.
  useEffect(() => {
    if (page > pageCount) setPage(1);
  }, [page, pageCount]);

  return { page: currentPage, setPage, pageCount, paged };
}

interface PaginationProps {
  /** 1-based 현재 페이지 */
  page: number;
  /** 전체 페이지 수 */
  pageCount: number;
  onChange: (page: number) => void;
  /** 한 번에 노출할 번호 개수(예: 1 2 3 4 5) */
  pageWindow?: number;
  className?: string;
}

/**
 * 번호 페이지네이션 (1 2 3 4 5 → 6 7 8 9 10).
 * 관리자 거래관리 화면과 동일한 스타일을 사용자 화면 전반에서 재사용한다.
 */
const Pagination: React.FC<PaginationProps> = ({
  page,
  pageCount,
  onChange,
  pageWindow = DEFAULT_PAGE_WINDOW,
  className = "",
}) => {
  if (pageCount <= 1) return null;

  const windowStart = Math.floor((page - 1) / pageWindow) * pageWindow + 1;
  const windowEnd = Math.min(windowStart + pageWindow - 1, pageCount);
  const pageNumbers = Array.from(
    { length: windowEnd - windowStart + 1 },
    (_, i) => windowStart + i,
  );

  return (
    <div className={`flex items-center justify-center gap-1.5 pt-1 ${className}`}>
      <button
        type="button"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
        aria-label="이전 페이지"
      >
        <FiChevronLeft size={15} />
      </button>

      {pageNumbers.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-current={n === page ? "page" : undefined}
          className={`h-8 min-w-8 rounded-lg px-2.5 text-sm font-semibold transition-colors ${
            n === page
              ? "bg-slate-900 text-white"
              : "border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          {n}
        </button>
      ))}

      <button
        type="button"
        onClick={() => onChange(Math.min(pageCount, page + 1))}
        disabled={page === pageCount}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
        aria-label="다음 페이지"
      >
        <FiChevronRight size={15} />
      </button>
    </div>
  );
};

export default Pagination;
