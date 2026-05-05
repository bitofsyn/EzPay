import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import {
  createLinkToken,
  getFinancialConnections,
  getKftcAccountInfo,
  getKftcRegisteredAccounts,
  importSampleTransactions,
  resetKftcConnection,
  saveKftcRegisteredAccountSelection,
  saveKftcSelectedAccount,
  syncFinancialConnection,
} from "../api/UserAPI";
import {
  FinancialConnection,
  FinancialDataProvider,
  KftcAccountInfoItem,
  KftcRegisteredAccountItem,
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
  const [provider] = useState<FinancialDataProvider>("KFTC_OPEN_BANKING");
  const [connections, setConnections] = useState<FinancialConnection[]>([]);
  const [kftcAccounts, setKftcAccounts] = useState<KftcAccountInfoItem[]>([]);
  const [registeredAccounts, setRegisteredAccounts] = useState<KftcRegisteredAccountItem[]>([]);
  const [error, setError] = useState("");
  const [registeredAccountsMessage, setRegisteredAccountsMessage] = useState("");
  const [isImportingSample, setIsImportingSample] = useState(false);
  const [startingRegistration, setStartingRegistration] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingRegisteredAccounts, setLoadingRegisteredAccounts] = useState(false);
  const [savingAccountKey, setSavingAccountKey] = useState<string>("");
  const [syncingConnectionId, setSyncingConnectionId] = useState<number | null>(null);
  const [resettingConnection, setResettingConnection] = useState(false);

  const userId = user?.userId;
  const kftcConnection = connections.find((item) => item.provider === "KFTC_OPEN_BANKING");
  const kftcStatusLabel =
    kftcConnection?.status === "CONSENT_EXPIRED"
      ? "재동의 필요"
      : kftcConnection
        ? "연결됨"
        : "미연결";

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

  const openRegistrationWindow = async () => {
    const result = await createLinkToken(userId as number, "KFTC_OPEN_BANKING");
    if (!result.linkToken) {
      throw new Error("오픈뱅킹 인증 URL을 받지 못했습니다.");
    }
    window.open(result.linkToken, "_blank", "noopener,noreferrer");
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
      const message = (err as any)?.response?.data?.message || "한국 거래 샘플을 불러오지 못했습니다.";
      setError(message);
    } finally {
      setIsImportingSample(false);
    }
  };

  const handleStartKftcRegistration = async () => {
    if (!userId) {
      setError("로그인 정보가 없습니다.");
      return;
    }

    setStartingRegistration(true);
    setError("");

    try {
      await openRegistrationWindow();
    } catch (err) {
      const message = (err as any)?.response?.data?.message || "오픈뱅킹 계좌등록을 시작하지 못했습니다.";
      setError(message);
    } finally {
      setStartingRegistration(false);
    }
  };

  const handleResetAndReconnectKftc = async () => {
    if (!userId) {
      setError("로그인 정보가 없습니다.");
      return;
    }

    if (!kftcConnection) {
      setError("재연결할 KFTC 연결이 없습니다.");
      return;
    }

    setResettingConnection(true);
    setError("");

    try {
      await resetKftcConnection(userId, kftcConnection.connectionId);
      await refreshConnections();
      await openRegistrationWindow();
    } catch (err) {
      const message = (err as any)?.response?.data?.message || "KFTC 연결을 해제하지 못했습니다.";
      setError(message);
    } finally {
      setResettingConnection(false);
    }
  };

  const handleLoadKftcAccounts = async () => {
    if (!userId) {
      setError("로그인 정보가 없습니다.");
      return;
    }

    setLoadingAccounts(true);
    setError("");

    try {
      const result = await getKftcAccountInfo(userId, kftcConnection?.connectionId);
      setKftcAccounts(result.resList ?? []);
    } catch (err) {
      const message = (err as any)?.response?.data?.message || "계좌 목록을 불러오지 못했습니다.";
      setError(message);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleLoadRegisteredAccounts = async () => {
    if (!userId) {
      setError("로그인 정보가 없습니다.");
      return;
    }

    setLoadingRegisteredAccounts(true);
    setError("");
    setRegisteredAccountsMessage("");

    try {
      const result = await getKftcRegisteredAccounts(userId, kftcConnection?.connectionId);
      const items = result.resList ?? [];
      setRegisteredAccounts(items);
      setRegisteredAccountsMessage(
        items.length > 0
          ? `등록 계좌 ${items.length}건을 불러왔습니다.`
          : `등록 계좌 조회는 완료됐지만 반환된 계좌가 없습니다. rsp_code=${result.rspCode ?? "-"}, rsp_message=${result.rspMessage ?? "-"}`
      );
    } catch (err) {
      const message = (err as any)?.response?.data?.message || "등록 계좌 목록을 불러오지 못했습니다.";
      setError(message);
    } finally {
      setLoadingRegisteredAccounts(false);
    }
  };

  const handleSelectAccount = async (account: KftcAccountInfoItem) => {
    if (!userId) {
      setError("로그인 정보가 없습니다.");
      return;
    }

    const key = `${account.bankCodeStd ?? ""}-${account.accountNum ?? ""}-${account.accountSeq ?? ""}`;
    setSavingAccountKey(key);
    setError("");

    try {
      const result = await saveKftcSelectedAccount(userId, {
        bankCodeStd: account.bankCodeStd,
        accountNum: account.accountNum,
        accountSeq: account.accountSeq,
        accountName: account.productName,
        accountLocalCode: account.accountLocalCode,
      });
      await refreshConnections();

      if (result.syncTriggered) {
        navigate("/transactions", {
          state: {
            syncSummary: {
              connectionId: result.connectionId,
              syncedCount: result.syncedRecordCount ?? 0,
              provider: "KFTC_OPEN_BANKING",
            },
          },
        });
      }
    } catch (err) {
      const message = (err as any)?.response?.data?.message || "계좌 선택을 저장하지 못했습니다.";
      setError(message);
    } finally {
      setSavingAccountKey("");
    }
  };

  const handleSelectRegisteredAccount = async (account: KftcRegisteredAccountItem) => {
    if (!userId) {
      setError("로그인 정보가 없습니다.");
      return;
    }

    const key = `${account.fintechUseNum ?? ""}-${account.accountNumMasked ?? ""}`;
    setSavingAccountKey(key);
    setError("");

    try {
      const result = await saveKftcRegisteredAccountSelection(userId, {
        fintechUseNum: account.fintechUseNum,
        bankCodeStd: account.bankCodeStd,
        accountNumMasked: account.accountNumMasked,
        accountAlias: account.accountAlias,
        accountHolderName: account.accountHolderName,
      });
      await refreshConnections();

      if (result.syncTriggered) {
        navigate("/transactions", {
          state: {
            syncSummary: {
              connectionId: result.connectionId,
              syncedCount: result.syncedRecordCount ?? 0,
              provider: "KFTC_OPEN_BANKING",
            },
          },
        });
      }
    } catch (err) {
      const message = (err as any)?.response?.data?.message || "등록 계좌 선택을 저장하지 못했습니다.";
      setError(message);
    } finally {
      setSavingAccountKey("");
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
                오픈뱅킹 연결과 동기화
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                인증, 계좌등록, 등록 계좌 선택, 거래 동기화를 한 화면에서 이어서 처리합니다.
                흐름은 단순하게 유지하고, 재동의가 필요한 경우만 별도로 표시합니다.
              </p>
            </div>

            <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-3 lg:min-w-[340px]">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">상태</div>
                <div className="mt-1 font-semibold text-slate-900 break-all">{kftcStatusLabel}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">연결 수</div>
                <div className="mt-1 font-semibold text-slate-900 break-all">{connections.length}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">기준 provider</div>
                <div className="mt-1 font-semibold text-slate-900 break-all">{provider}</div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
            <div className="rounded-2xl border border-slate-200 bg-slate-950 p-6 text-slate-50">
              <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Primary Flow</div>
              <h2 className="mt-2 text-xl font-semibold">새 등록 또는 재동의가 필요하면 여기서 시작합니다.</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                KFTC 동의가 만료된 경우에도 이 버튼 하나로 연결을 새로 열고, 필요한 데이터를 다시 받는 흐름으로 이어집니다.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  text={startingRegistration ? "계좌등록 시작 중..." : "오픈뱅킹 계좌등록 시작"}
                  onClick={handleStartKftcRegistration}
                  disabled={startingRegistration}
                  className="!bg-white !text-slate-950 hover:!bg-slate-100"
                />
                <Button
                  text={resettingConnection ? "재연결 준비 중..." : "연결 해제 후 재연결"}
                  onClick={handleResetAndReconnectKftc}
                  disabled={resettingConnection || startingRegistration || !kftcConnection}
                  className="border border-slate-600 bg-slate-900 text-slate-100 hover:bg-slate-800"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="text-xs uppercase tracking-[0.22em] text-slate-500">요약</div>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  1. 사용자 인증 후 토큰과 `fintech_use_num`을 저장합니다.
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  2. 등록 계좌를 선택한 뒤 거래 동기화를 진행합니다.
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  3. 동의 만료는 재연결이 아니라 KFTC 재승인이 필요합니다.
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
              <div className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Connection Snapshot</div>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">연결 현황</h2>
              <p className="mt-2 text-sm text-slate-600">
                상태와 마지막 오류를 한 눈에 보고, 거래 동기화는 같은 카드에서 바로 실행합니다.
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
                        <div className="break-all">fintech_use_num: {connection.fintechUseNum ?? "미저장"}</div>
                        <div className="truncate">선택 계좌: {connection.selectedAccountName ?? "미선택"}</div>
                        <div className="truncate">최근 동기화: {formatDateTime(connection.lastSyncedAt)}</div>
                        <div className="truncate" title={connection.lastErrorMessage ?? ""}>마지막 오류: {connection.lastErrorMessage ?? "-"}</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        text={syncingConnectionId === connection.connectionId ? "동기화 중..." : "거래 동기화"}
                        onClick={() => handleSync(connection.connectionId)}
                        disabled={syncingConnectionId === connection.connectionId}
                        className="bg-slate-900 hover:bg-slate-800"
                      />
                      {connection.status === "CONSENT_EXPIRED" && (
                        <Button
                          text={startingRegistration ? "재동의 진행 중..." : "재동의 진행하기"}
                          onClick={handleStartKftcRegistration}
                          disabled={startingRegistration}
                          className="border border-amber-200 bg-amber-100 text-amber-900 hover:bg-amber-200"
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Registered Accounts</div>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">등록 계좌</h2>
              <p className="mt-2 text-sm text-slate-600">
                등록 계좌를 불러와 `fintech_use_num`을 선택하고, 그 계좌 기준으로 동기화를 진행합니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                text={loadingRegisteredAccounts ? "불러오는 중..." : "등록 계좌 불러오기"}
                onClick={handleLoadRegisteredAccounts}
                disabled={loadingRegisteredAccounts}
                className="bg-slate-900 hover:bg-slate-800"
              />
              <Button
                text={isImportingSample ? "샘플 불러오는 중..." : "샘플 거래 불러오기"}
                onClick={handleImportSample}
                disabled={isImportingSample}
                className="border border-slate-200 !bg-white !text-slate-800 hover:!bg-slate-50"
              />
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {registeredAccountsMessage && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {registeredAccountsMessage}
              </div>
            )}
            {registeredAccounts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                등록 계좌가 아직 없습니다.
              </div>
            ) : (
              registeredAccounts.map((account) => {
                const accountKey = `${account.fintechUseNum ?? ""}-${account.accountNumMasked ?? ""}`;
                const isSaving = savingAccountKey === accountKey;

                return (
                  <div key={accountKey} className="rounded-2xl border border-slate-200 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="text-sm font-medium text-slate-500">
                          {account.bankName ?? "은행명 없음"} · {account.bankCodeStd ?? "-"}
                        </div>
                        <div className="mt-1 text-lg font-semibold text-slate-950 break-words">
                          {account.accountAlias ?? account.accountHolderName ?? "등록 계좌"}
                        </div>
                        <div className="mt-2 grid gap-2 text-sm text-slate-600 sm:grid-cols-2 break-words">
                          <div className="break-all">핀테크이용번호: {account.fintechUseNum ?? "-"}</div>
                          <div className="truncate">마스킹 계좌번호: {account.accountNumMasked ?? "-"}</div>
                          <div className="truncate">계좌 유형: {account.accountType ?? "-"}</div>
                          <div className="truncate">동의 상태: {account.inquiryAgreeYn ?? "-"}</div>
                        </div>
                      </div>
                      <Button
                        text={isSaving ? "선택 저장 중..." : "이 계좌로 동기화"}
                        onClick={() => handleSelectRegisteredAccount(account)}
                        disabled={isSaving}
                        className="bg-slate-900 hover:bg-slate-800"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Advanced</div>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">보조 조회</h2>
              <p className="mt-2 text-sm text-slate-600">
                필요할 때만 사용하는 조회 도구입니다. 기본 경로는 등록 계좌 기반 동기화입니다.
              </p>
            </div>
            <Button
              text={loadingAccounts ? "조회 중..." : "계좌통합조회 시도"}
              onClick={handleLoadKftcAccounts}
              disabled={loadingAccounts}
              className="border border-slate-200 !bg-white !text-slate-800 hover:!bg-slate-50"
            />
          </div>

          <div className="mt-6 space-y-4">
            {kftcAccounts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                아직 조회된 계좌가 없습니다.
              </div>
            ) : (
              kftcAccounts.map((account, idx) => {
                const key = `${account.accountNum ?? idx}-${account.accountSeq ?? idx}`;
                const accountKey = `${account.bankCodeStd ?? ""}-${account.accountNum ?? ""}-${account.accountSeq ?? ""}`;
                const isSaving = savingAccountKey === accountKey;

                return (
                  <div key={key} className="rounded-2xl border border-slate-200 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="text-sm font-medium text-slate-500">
                          {account.bankCodeStd ?? "-"} · {account.activityType ?? "계좌"}
                        </div>
                        <div className="mt-1 text-lg font-semibold text-slate-950 break-words">
                          {account.productName ?? account.accountNum ?? "계좌"}
                        </div>
                        <div className="mt-2 grid gap-2 text-sm text-slate-600 sm:grid-cols-2 break-words">
                          <div className="break-all">계좌번호: {account.accountNum ?? "-"}</div>
                          <div className="truncate">회차번호: {account.accountSeq ?? "-"}</div>
                          <div className="truncate">잔액: {account.balanceAmt ?? "-"}</div>
                          <div className="truncate">사용 가능: {account.availableAmt ?? "-"}</div>
                        </div>
                      </div>
                      <Button
                        text={isSaving ? "저장 중..." : "이 계좌로 동기화"}
                        onClick={() => handleSelectAccount(account)}
                        disabled={isSaving}
                        className="bg-slate-900 hover:bg-slate-800"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default CreateAccount;
