import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import {
  createLinkToken,
  exchangeFinancialConnection,
  getFinancialConnections,
  syncFinancialConnection,
} from "../api/UserAPI";
import {
  ConnectionExchangeResult,
  ConnectionLinkToken,
  FinancialConnection,
  FinancialDataProvider,
  User,
} from "../types";
import { getUserData } from "../utils/storage";

declare global {
  interface Window {
    Plaid?: {
      create: (config: {
        token: string;
        onSuccess: (publicToken: string) => void;
        onExit?: (error: unknown) => void;
      }) => { open: () => void };
    };
  }
}

const PLAID_SCRIPT_SRC = "https://cdn.plaid.com/link/v2/stable/link-initialize.js";

const loadPlaidScript = async (): Promise<void> => {
  if (window.Plaid) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${PLAID_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Plaid script load failed")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = PLAID_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Plaid script load failed"));
    document.body.appendChild(script);
  });
};

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
  const [linkToken, setLinkToken] = useState<ConnectionLinkToken | null>(null);
  const [exchangeResult, setExchangeResult] = useState<ConnectionExchangeResult | null>(null);
  const [error, setError] = useState("");
  const [isLoadingLinkToken, setIsLoadingLinkToken] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [syncingConnectionId, setSyncingConnectionId] = useState<number | null>(null);

  const userId = user?.userId;

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

  const handlePrepareLink = async () => {
    if (!userId) {
      setError("로그인 정보가 없습니다.");
      return;
    }

    setIsLoadingLinkToken(true);
    setError("");

    try {
      await loadPlaidScript();
      const token = await createLinkToken(userId, provider);
      setLinkToken(token);
    } catch (err) {
      const message = (err as any)?.response?.data?.message || "Plaid 연결 준비에 실패했습니다.";
      setError(message);
    } finally {
      setIsLoadingLinkToken(false);
    }
  };

  const handleLaunchPlaid = async () => {
    if (!userId) {
      setError("로그인 정보가 없습니다.");
      return;
    }

    setIsConnecting(true);
    setError("");

    try {
      const currentLinkToken = linkToken ?? (await createLinkToken(userId, provider));
      setLinkToken(currentLinkToken);

      await loadPlaidScript();
      if (!window.Plaid) {
        throw new Error("Plaid Link를 사용할 수 없습니다.");
      }

      await new Promise<void>((resolve, reject) => {
        const handler = window.Plaid!.create({
          token: currentLinkToken.linkToken,
          onSuccess: async (publicToken: string) => {
            try {
              const result = await exchangeFinancialConnection(userId, publicToken, provider);
              setExchangeResult(result);
              await refreshConnections();
              resolve();
            } catch (err) {
              reject(err);
            }
          },
          onExit: (plaidError) => {
            if (plaidError) {
              reject(plaidError);
              return;
            }
            resolve();
          },
        });

        handler.open();
      });
    } catch (err) {
      const message =
        (err as any)?.response?.data?.message ||
        (err as Error)?.message ||
        "Plaid 계좌 연결 중 오류가 발생했습니다.";
      setError(message);
    } finally {
      setIsConnecting(false);
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

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6">
            <div className="inline-flex rounded-full bg-cyan-50 px-3 py-1 text-sm font-medium text-cyan-700">
              Financial Data Connection
            </div>
            <h1 className="mt-4 text-3xl font-bold text-slate-900">계좌 연결</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Plaid Sandbox를 통해 거래 데이터를 연결하고, 이후 동기화된 거래를 EzPay 분석 파이프라인에 반영합니다.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-lg font-semibold text-slate-900">연결 절차</h2>
              <p className="mt-2 text-sm text-slate-600">
                1. Link token 생성
                <br />
                2. Plaid Link에서 계좌 연결
                <br />
                3. Public token 교환
                <br />
                4. 거래 내역 동기화
              </p>
              <div className="mt-5 space-y-3">
                <Button
                  text={isLoadingLinkToken ? "연결 준비 중..." : "1. Link Token 준비"}
                  onClick={handlePrepareLink}
                  disabled={isLoadingLinkToken || isConnecting}
                  className="w-full bg-slate-900 hover:bg-slate-800"
                />
                <Button
                  text={isConnecting ? "Plaid 연결 중..." : "2. Plaid Link 열기"}
                  onClick={handleLaunchPlaid}
                  disabled={isConnecting || isLoadingLinkToken}
                  className="w-full bg-cyan-600 hover:bg-cyan-700"
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-slate-900">현재 상태</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="font-medium text-slate-800">Provider</div>
                  <div className="mt-1">Plaid Sandbox</div>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="font-medium text-slate-800">Link Token</div>
                  <div className="mt-1 break-all">{linkToken?.linkToken ?? "아직 생성되지 않음"}</div>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="font-medium text-slate-800">최근 연결 결과</div>
                  <div className="mt-1 break-all">
                    {exchangeResult?.connectionReference ?? "아직 연결되지 않음"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">연결된 데이터 소스</h2>
              <p className="mt-2 text-sm text-slate-600">
                연결된 계좌 단위로 거래 동기화를 수행합니다.
              </p>
            </div>
            <Button
              text="목록 새로고침"
              onClick={() => refreshConnections().catch(() => setError("연결 목록을 새로고침하지 못했습니다."))}
              className="bg-slate-700 hover:bg-slate-800"
            />
          </div>

          <div className="mt-6 space-y-4">
            {connections.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                아직 연결된 금융 데이터 소스가 없습니다.
              </div>
            ) : (
              connections.map((connection) => (
                <div
                  key={connection.connectionId}
                  className="rounded-xl border border-slate-200 p-5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-sm font-medium text-slate-500">{connection.provider}</div>
                      <div className="mt-1 text-lg font-semibold text-slate-900">
                        {connection.connectionReference}
                      </div>
                      <div className="mt-2 text-sm text-slate-600">
                        상태: {connection.status}
                        <br />
                        최근 동기화: {formatDateTime(connection.lastSyncedAt)}
                      </div>
                    </div>
                    <Button
                      text={syncingConnectionId === connection.connectionId ? "동기화 중..." : "거래 동기화"}
                      onClick={() => handleSync(connection.connectionId)}
                      disabled={syncingConnectionId === connection.connectionId}
                      className="bg-cyan-600 hover:bg-cyan-700"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAccount;
