import React, { memo, useMemo, useCallback } from "react";
import { FiTrash2 } from "react-icons/fi";
import type { Transaction } from "../../../types";
import { Table, BadgeLight } from "../../ui";
import type { TableColumn } from "../../../types";
import { formatAmount } from "../../../utils/formatters";

interface TransactionListProps {
  data: Transaction[];
  isLoading?: boolean;
  onDeleteTransaction?: (id: number) => void;
}

/**
 * 최적화된 거래 목록 컴포넌트
 * - React.memo로 불필요한 리렌더링 방지
 * - useCallback으로 핸들러 메모이제이션
 * - useMemo로 테이블 컬럼 안정화
 */
const TransactionList: React.FC<TransactionListProps> = memo(
  ({ data, isLoading = false, onDeleteTransaction }) => {
    const handleDelete = useCallback(
      (transactionId: number) => {
        onDeleteTransaction?.(transactionId);
      },
      [onDeleteTransaction]
    );

    const columns: TableColumn<Transaction>[] = useMemo(
      () => [
        {
          key: "transactionId",
          label: "거래 ID",
          render: (value) => `#${value}`,
        },
        {
          key: "senderAccount",
          label: "보낸 계좌",
          render: (sender) => (
            <div className="text-sm">
              <div className="font-semibold">{sender?.accountNumber}</div>
              <div className="text-xs text-slate-400">{sender?.bankName}</div>
            </div>
          ),
        },
        {
          key: "receiverAccount",
          label: "받는 계좌",
          render: (receiver) => (
            <div className="text-sm">
              <div className="font-semibold">{receiver?.accountNumber}</div>
              <div className="text-xs text-slate-400">{receiver?.bankName}</div>
            </div>
          ),
        },
        {
          key: "amount",
          label: "금액",
          width: "150px",
          render: (value) => <span className="text-cyan-700 font-bold">{formatAmount(value)}원</span>,
        },
        {
          key: "status",
          label: "상태",
          width: "120px",
          render: (status) => <BadgeLight variant="status" value={status} />,
        },
        {
          key: "transactionDate",
          label: "일시",
          width: "180px",
          render: (date) => new Date(date).toLocaleString("ko-KR"),
        },
        {
          key: "description",
          label: "설명",
          render: (desc, row) => desc || row.memo || "-",
        },
      ],
      []
    );

    const tableData = useMemo(() => data, [data]);

    return (
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <Table<Transaction>
          data={tableData}
          columns={columns}
          isLoading={isLoading}
          emptyMessage="조회된 거래 내역이 없습니다."
        />
        {onDeleteTransaction && (
          <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => handleDelete(data[0]?.transactionId)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50 rounded-lg transition"
            >
              <FiTrash2 size={16} />
              선택 삭제
            </button>
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.isLoading === nextProps.isLoading &&
      prevProps.data.length === nextProps.data.length &&
      prevProps.data === nextProps.data
    );
  }
);

TransactionList.displayName = "TransactionList";

export default TransactionList;
