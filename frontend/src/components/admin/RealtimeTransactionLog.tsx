import React from "react";
import { FiArrowRight, FiCheck, FiClock, FiX } from "react-icons/fi";
import { formatAmount } from "../../utils/formatters";

interface Transaction {
  transactionId: number;
  amount: number;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  transactionDate: string;
  senderAccount: { accountNumber: string; bankName: string };
  receiverAccount: { accountNumber: string; bankName: string };
}

interface RealtimeTransactionLogProps {
  transactions: Transaction[];
}

const statusConfig = {
  SUCCESS: {
    icon: FiCheck,
    color: 'bg-emerald-100 text-emerald-700',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    label: '완료'
  },
  PENDING: {
    icon: FiClock,
    color: 'bg-amber-100 text-amber-700',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    label: '진행중'
  },
  FAILED: {
    icon: FiX,
    color: 'bg-rose-100 text-rose-700',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    label: '실패'
  }
};

const RealtimeTransactionLog: React.FC<RealtimeTransactionLogProps> = ({ transactions }) => {
  return (
    <div className="space-y-3">
      {transactions.length > 0 ? (
        transactions.map((tx, index) => {
          const config = statusConfig[tx.status];
          const Icon = config.icon;
          const txDate = new Date(tx.transactionDate);
          const now = new Date();
          const diffMs = now.getTime() - txDate.getTime();
          const diffSec = Math.floor(diffMs / 1000);

          let timeText = '방금 전';
          if (diffSec < 60) timeText = `${diffSec}초 전`;
          else if (diffSec < 3600) timeText = `${Math.floor(diffSec / 60)}분 전`;
          else timeText = `${Math.floor(diffSec / 3600)}시간 전`;

          return (
            <div
              key={`${tx.transactionId}-${index}`}
              className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white px-4 py-3 hover:border-slate-200 hover:shadow-sm transition-all"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${config.color}`}>
                <Icon size={18} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-sm font-bold text-slate-900 truncate">
                      {tx.senderAccount.bankName}
                    </span>
                    <FiArrowRight size={14} className="shrink-0 text-slate-300" />
                    <span className="text-sm font-bold text-slate-900 truncate">
                      {tx.receiverAccount.bankName}
                    </span>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${config.badge}`}>
                    {config.label}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div>
                    <span>{tx.senderAccount.accountNumber}</span>
                    <span className="mx-1">→</span>
                    <span>{tx.receiverAccount.accountNumber}</span>
                  </div>
                  <span>{timeText}</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="text-sm font-black text-slate-900">
                  {formatAmount(tx.amount)}원
                </p>
              </div>
            </div>
          );
        })
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
          <p className="text-sm font-semibold text-slate-500">최근 거래 내역이 없습니다.</p>
        </div>
      )}
    </div>
  );
};

export default RealtimeTransactionLog;
