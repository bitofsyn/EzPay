import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import {
  createLinkToken,
  getFinancialConnections,
  importSampleTransactions,
  syncFinancialConnection,
} from "../api/UserAPI";
import {
  FinancialConnection,
  FinancialDataProvider,
  User,
} from "../types";
import { getUserData } from "../utils/storage";

const formatDateTime = (value?: string) => {
  if (!value) {
    return "아직 동기화되지 않음";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("ko-KR");
};

const CreateAccount: React.FC = () => {
  const navigate = useNavigate();
  const user = useMemo<User | null>(() => getUserData(), []);
  const [provider] = useState<FinancialDataProvider>("PLAID_SANDBOX");
  const [connections, setConnections] = useState<FinancialConnection[]>([]);
  const [error, setError] = useState("");
  const [isImportingSample, setIsImportingSample] = useState(false);
  const [startingLinkToken, setStartingLinkToken] = useState(false);
  const [syncingConnectionId, setSyncingConnectionId] = useState<number | null>(null);

  const userId = user?.userId;
  const plaidConnection = connections.find((item) => item.provider === "PLAID_SANDBOX");

  const refreshConnections = async () => {
    if (!userId) {
      return;
    }

    const items = await getFinancialConnections(userId);
    setConnections(items);
  };

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }

    refreshConnections().catch((err) => {
      const message = (err as any)?.response?.data?.message || "연결 목록을 불러오지 못했습니다.";
      setError(message);
    });
  }, [navigate, userId]);

  const handleCreateLinkToken = async () => {
    if (!userId) {
      setError("로그인 정보가 없습니다.");
      return;
    }

    setStartingLinkToken(true);
    setError("");

    try {
      const result = await createLinkToken(userId, "PLAID_SANDBOX");
      if (!result.linkToken) {
        throw new Error("Link Token을 받지 못했습니다.");
      }
      window.open(result.linkToken, "_blank", "noopener,noreferrer");
    } catch (err) {
      const message = (err as any)?.response?.data?.message || "Link Token 생성에 실패했습니다.";
      setError(message);
    } finally {
      setStartingLinkToken(false);
    }
  };

  const handleSync = async (connectionId: number) => {
    if (!userId) {
      setError("로그인 정보가 없습니다.");
      return;
    }

    setSyncingConnectionId(connectionId);
    setError("");

    try {
      const result = await syncFinancialConnection(userId, connectionId);
      await refreshConnections();
      navigate("/transactions", {
        state: {
          syncSummary: {
            connectionId,
            syncedCount: result.records.length,
            provider: result.provider,
          },
        },
      });
    } catch (err) {
      const message = (err as any)?.response?.data?.message || "거래 동기화에 실패했습니다.";
      setError(message);
    } finally {
      setSyncingConnectionId(null);
    }
  };

  const handleImportSample = async () => {
    if (!userId) {
      setError("로그인 정보가 없습니다.");
      return;
    }

    setIsImportingSample(true);
    setError("");

    try {
      const result = await importSampleTransactions(userId);
      await refreshConnections();
      navigate("/transactions", {
        state: {
          syncSummary: {
            connectionId: 0,
            syncedCount: result.records.length,
            provider: result.provider,
          },
        },
      });
    } catch (err) {
      const message = (err as any)?.response?.data?.message || "샘플 거래를 불러오지 못했습니다.";
      setError(message);
    } finally {
      setIsImportingSample(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
                Financial Data Connection
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                금융 데이터 연결
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Plaid 연결을 통해 금융 데이터를 가져오고 거래를 동기화할 수 있습니다.
              </p>
            </div>

            <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2 lg:min-w-[280px]">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">연결 수</div>
                <div className="mt-1 font-semibold text-slate-900 break-all">{connections.length}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">제공자</div>
                <div className="mt-1 font-semibold text-slate-900 break-all">{provider}</div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
            <div className="rounded-2xl border border-slate-200 bg-slate-950 p-6 text-slate-50">
              <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Primary Flow</div>
              <h2 className="mt-2 text-xl font-semibold">새 연결을 추가하거나 샘플 데이터를 불러옵니다.</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                Plaid Link를 통해 금융 기관에 안전하게 연결하거나, 테스트 용도로 샘플 거래를 불러올 수 있습니다.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  text={startingLinkToken ? "연결 중..." : "Plaid 연결 시작"}
                  onClick={handleCreateLinkToken}
                  disabled={startingLinkToken}
                  className="!bg-white !text-slate-950 hover:!bg-slate-100"
                />
                <Button
                  text={isImportingSample ? "샘플 불러오는 중..." : "샘플 거래 불러오기"}
                  onClick={handleImportSample}
                  disabled={isImportingSample}
                  className="border border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-800"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="text-xs uppercase tracking-[0.22em] text-slate-500">단계</div>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  1. Plaid Link를 통해 계좌를 연결합니다.
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  2. 거래 동기화를 실행합니다.
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  3. 거래 목록에서 확인합니다.
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Connection Status</div>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">연결 현황</h2>
              <p className="mt-2 text-sm text-slate-600">
                현재 활성화된 연결 목록과 거래 동기화 상태를 확인합니다.
              </p>
            </div>
            <Button
              text="목록 새로고침"
              onClick={() => refreshConnections().catch(() => setError("연결 목록을 새로고침하지 못했습니다."))}
              className="border border-slate-200 !bg-white !text-slate-800 hover:!bg-slate-50"
            />
          </div>

          <div className="mt-6 grid gap-4">
            {connections.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                아직 연결된 금융 데이터 소스가 없습니다.
              </div>
            ) : (
              connections.map((connection) => (
                <div key={connection.connectionId} className="rounded-2xl border border-slate-200 p-5">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                          {connection.provider}
                        </span>
                        <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
                          {connection.status}
                        </span>
                      </div>
                      <div className="text-lg font-semibold text-slate-950 break-all">{connection.connectionReference}</div>
                      <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2 break-words">
                        <div className="truncate">계좌 참조: {connection.providerAccountReference ?? "없음"}</div>
                        <div className="truncate">최근 동기화: {formatDateTime(connection.lastSyncedAt)}</div>
                        <div className="truncate" title={connection.lastErrorMessage ?? ""}>
                          마지막 오류: {connection.lastErrorMessage ?? "-"}
                        </div>
                      </div>
                    </div>
                    <Button
                      text={syncingConnectionId === connection.connectionId ? "동기화 중..." : "거래 동기화"}
                      onClick={() => handleSync(connection.connectionId)}
                      disabled={syncingConnectionId === connection.connectionId}
                      className="bg-slate-900 hover:bg-slate-800"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default CreateAccount;
