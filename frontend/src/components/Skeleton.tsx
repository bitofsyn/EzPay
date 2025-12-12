import React from "react";

interface SkeletonProps {
  className?: string;
}

// 기본 스켈레톤 박스
export const Skeleton: React.FC<SkeletonProps> = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

// 계좌 카드 스켈레톤
export const AccountCardSkeleton: React.FC = () => (
  <div className="bg-white shadow-md rounded-2xl p-6 w-full max-w-lg">
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-8 w-28" />
    </div>
    <div className="mt-6">
      <Skeleton className="h-40 w-full" />
    </div>
  </div>
);

// 거래 내역 아이템 스켈레톤
export const TransactionItemSkeleton: React.FC = () => (
  <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl">
    <div className="flex items-center gap-2">
      <Skeleton className="h-5 w-5 rounded-full" />
      <div className="space-y-1">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
    <Skeleton className="h-5 w-24" />
  </div>
);

// 거래 내역 리스트 스켈레톤
export const TransactionListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <TransactionItemSkeleton key={i} />
    ))}
  </div>
);

// 대시보드 스켈레톤
export const DashboardSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gray-100 p-6 space-y-6">
    {/* 계좌 카드 */}
    <AccountCardSkeleton />

    {/* 요약 카드 */}
    <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
      <div className="bg-white shadow-md rounded-2xl p-4">
        <Skeleton className="h-4 w-16 mb-2" />
        <Skeleton className="h-6 w-24" />
      </div>
      <div className="bg-white shadow-md rounded-2xl p-4">
        <Skeleton className="h-4 w-16 mb-2" />
        <Skeleton className="h-6 w-24" />
      </div>
    </div>

    {/* 거래 내역 */}
    <div className="bg-white mt-8 p-6 shadow-md rounded-2xl w-full max-w-lg">
      <Skeleton className="h-6 w-32 mb-4" />
      <TransactionListSkeleton count={3} />
    </div>
  </div>
);

// 설정 페이지 스켈레톤
export const SettingsSkeleton: React.FC = () => (
  <div className="space-y-4">
    <div className="bg-white p-6 rounded-xl shadow">
      <Skeleton className="h-6 w-24 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4" />
    </div>
    <div className="bg-white p-6 rounded-xl shadow">
      <Skeleton className="h-6 w-32 mb-4" />
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  </div>
);

// 테이블 스켈레톤
export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 4
}) => (
  <div className="bg-white rounded-lg shadow overflow-hidden">
    {/* 헤더 */}
    <div className="bg-gray-50 px-4 py-3 flex gap-4">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
    {/* 행 */}
    {Array.from({ length: rows }).map((_, rowIdx) => (
      <div key={rowIdx} className="px-4 py-3 flex gap-4 border-t">
        {Array.from({ length: cols }).map((_, colIdx) => (
          <Skeleton key={colIdx} className="h-4 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

export default Skeleton;
