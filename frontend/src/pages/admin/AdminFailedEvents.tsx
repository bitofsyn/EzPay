import { useCallback, useEffect, useState } from "react";
import { FiInbox, FiRefreshCw, FiRotateCcw } from "react-icons/fi";
import toast from "react-hot-toast";
import { getFailedEvents, retryFailedEvent } from "../../api/AdminAPI";
import AdminShell from "../../components/admin/AdminShell";
import type { FailedEventInfo, FailedEventStatus } from "../../types";

const statusStyle: Record<FailedEventStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  RETRYING: "bg-sky-50 text-sky-700",
  RESOLVED: "bg-emerald-50 text-emerald-700",
  RETRY_FAILED: "bg-rose-50 text-rose-700",
};

const statusLabel: Record<FailedEventStatus, string> = {
  PENDING: "대기",
  RETRYING: "재처리 중",
  RESOLVED: "처리 완료",
  RETRY_FAILED: "재처리 실패",
};

const AdminFailedEvents = () => {
  const [events, setEvents] = useState<FailedEventInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setEvents(await getFailedEvents());
    } catch (error) {
      console.error(error);
      toast.error("실패 이벤트를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const retry = async (id: number) => {
    setRetryingId(id);
    try {
      const result = await retryFailedEvent(id);
      setEvents((current) => current.map((event) => (event.id === id ? result : event)));
      if (result.status === "RESOLVED") toast.success("이벤트를 원본 토픽에 다시 발행했습니다.");
      else toast.error(result.lastRetryError ?? "이벤트 재처리에 실패했습니다.");
    } catch (error) {
      console.error(error);
      toast.error("이벤트 재처리 요청에 실패했습니다.");
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <AdminShell
      title="실패 이벤트"
      description="Kafka DLT 이벤트 조회 및 수동 재처리"
      actions={
        <button type="button" onClick={load} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600">
          <FiRefreshCw /> 새로고침
        </button>
      }
    >
      <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50 text-left text-xs font-bold text-slate-400">
              <tr>
                <th className="px-5 py-4">토픽</th>
                <th className="px-5 py-4">오류</th>
                <th className="px-5 py-4">상태</th>
                <th className="px-5 py-4">재시도</th>
                <th className="px-5 py-4 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-16 text-center text-sm text-slate-400">불러오는 중입니다.</td></tr>
              ) : events.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-16 text-center text-sm text-slate-400"><FiInbox className="mx-auto mb-2" size={24} />실패 이벤트가 없습니다.</td></tr>
              ) : events.map((event) => (
                <tr key={event.id} className="align-top hover:bg-slate-50/70">
                  <td className="px-5 py-4 text-sm font-bold text-slate-700">{event.topic}</td>
                  <td className="max-w-lg px-5 py-4 text-sm text-slate-600">
                    <p>{event.errorMessage || "오류 정보 없음"}</p>
                    {event.lastRetryError && <p className="mt-1 text-xs text-rose-600">{event.lastRetryError}</p>}
                  </td>
                  <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle[event.status]}`}>{statusLabel[event.status]}</span></td>
                  <td className="px-5 py-4 text-sm text-slate-500">{event.retryCount}회</td>
                  <td className="px-5 py-4 text-center">
                    <button
                      type="button"
                      disabled={event.status === "RESOLVED" || retryingId === event.id}
                      onClick={() => retry(event.id)}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <FiRotateCcw className={retryingId === event.id ? "animate-spin" : ""} /> 재처리
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
};

export default AdminFailedEvents;
