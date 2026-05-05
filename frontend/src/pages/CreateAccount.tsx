import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import {
  createLinkToken,
  getFinancialConnections,
  getKftcAccountInfo,
  getKftcRegisteredAccounts,
  importSampleTransactions,
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
      const result = await createLinkToken(userId, "KFTC_OPEN_BANKING");
      const registrationUrl = result.linkToken;

      if (!registrationUrl) {
        throw new Error("오픈뱅킹 인증 URL을 받지 못했습니다.");
      }

      window.open(registrationUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      const message = (err as any)?.response?.data?.message || "오픈뱅킹 계좌등록을 시작하지 못했습니다.";
      setError(message);
    } finally {
      setStartingRegistration(false);
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
      const connection = connections.find((item) => item.provider === "KFTC_OPEN_BANKING");
      const result = await getKftcAccountInfo(userId, connection?.connectionId);
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
      const connection = connections.find((item) => item.provider === "KFTC_OPEN_BANKING");
      const result = await getKftcRegisteredAccounts(userId, connection?.connectionId);
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
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6">
            <div className="inline-flex rounded-full bg-cyan-50 px-3 py-1 text-sm font-medium text-cyan-700">
              Financial Data Connection
            </div>
            <h1 className="mt-4 text-3xl font-bold text-slate-900">오픈뱅킹 연동 준비</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              EzPay는 한국 금융 데이터 기준으로 방향을 전환했습니다. 메인 연동 경로는 금융결제원 오픈뱅킹 조회형 API이며,
              현재 화면은 연결 구조와 거래 동기화 경로를 점검하는 용도입니다.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-lg font-semibold text-slate-900">연동 방향</h2>
              <p className="mt-2 text-sm text-slate-600">
                1. 사용자 동의 기반 계좌 연결
                <br />
                2. Access token / 핀테크이용번호 확보
                <br />
                3. 거래내역조회 API 호출
                <br />
                4. 정규화 및 인사이트 생성
              </p>
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-900">
                한국 금융 데이터 기준으로는 Plaid를 메인 경로로 사용할 수 없습니다.
                <br />
                현재는 KFTC Open Banking 경로를 기준으로 인증 콜백에서 인가 코드와 토큰 교환을 자동 저장하고,
                저장된 `fintech_use_num`과 선택 계좌를 기준으로 거래 동기화를 이어갑니다.
              </div>
              <div className="mt-5">
                <Button
                  text={startingRegistration ? "오픈뱅킹 계좌등록 시작 중..." : "오픈뱅킹 계좌등록 시작"}
                  onClick={handleStartKftcRegistration}
                  disabled={startingRegistration}
                  className="w-full bg-cyan-700 hover:bg-cyan-800"
                />
              </div>
              <div className="mt-3">
                <Button
                  text={isImportingSample ? "한국 거래 샘플 불러오는 중..." : "한국 거래 샘플 불러오기"}
                  onClick={handleImportSample}
                  disabled={isImportingSample}
                  className="w-full bg-slate-900 hover:bg-slate-800"
                />
              </div>
              <div className="mt-3">
                <Button
                  text={loadingRegisteredAccounts ? "등록 계좌 불러오는 중..." : "등록 계좌 불러오기"}
                  onClick={handleLoadRegisteredAccounts}
                  disabled={loadingRegisteredAccounts}
                  className="w-full bg-emerald-700 hover:bg-emerald-800"
                />
              </div>
              <div className="mt-3">
                <Button
                  text={loadingAccounts ? "보조 계좌조회 시도 중..." : "계좌통합조회 시도"}
                  onClick={handleLoadKftcAccounts}
                  disabled={loadingAccounts}
                  className="w-full bg-cyan-600 hover:bg-cyan-700"
                />
              </div>
              <div className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-600">
                오픈뱅킹 인증 후 돌아오는 콜백은 backend의
                <span className="font-medium text-slate-900"> `/api/connections/kftc/account-registration/callback`</span>
                에서 처리합니다.
              </div>
              <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                현재 기준 provider: <span className="font-medium text-slate-900">{provider}</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-slate-900">현재 상태</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="font-medium text-slate-800">메인 연동 대상</div>
                  <div className="mt-1">KFTC Open Banking 거래내역조회</div>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="font-medium text-slate-800">현재 구현 상태</div>
                  <div className="mt-1">인가 코드 저장, 토큰 교환, 계좌등록 콜백 저장, 거래 sync/정규화 경로 구현</div>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="font-medium text-slate-800">다음 구현 항목</div>
                  <div className="mt-1">실환경 KFTC 앱 설정 검증, 오류 코드 처리, 재동기화 안정화</div>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <div className="font-medium text-slate-900">연결 요약</div>
                {connections.find((item) => item.provider === "KFTC_OPEN_BANKING") ? (
                  <div className="mt-2 space-y-1">
                    <div>상태: {connections.find((item) => item.provider === "KFTC_OPEN_BANKING")?.status}</div>
                    <div>
                      fintech_use_num:{" "}
                      {connections.find((item) => item.provider === "KFTC_OPEN_BANKING")?.fintechUseNum ?? "미저장"}
                    </div>
                    <div>
                      선택 계좌:{" "}
                      {connections.find((item) => item.provider === "KFTC_OPEN_BANKING")?.selectedAccountName ??
                        "미선택"}
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 text-slate-500">아직 KFTC 연결이 없습니다.</div>
                )}
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
                KFTC는 저장된 선택 계좌와 `fintech_use_num`을 기준으로 거래 동기화를 이어갑니다.
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

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">등록 계좌 목록</h2>
              <p className="mt-2 text-sm text-slate-600">
                사용자 토큰과 `user_seq_no`로 등록 계좌를 조회해 `fintech_use_num`을 확보합니다.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {registeredAccountsMessage && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {registeredAccountsMessage}
              </div>
            )}
            {registeredAccounts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                아직 등록 계좌 목록이 없습니다.
              </div>
            ) : (
              registeredAccounts.map((account) => {
                const accountKey = `${account.fintechUseNum ?? ""}-${account.accountNumMasked ?? ""}`;
                const isSaving = savingAccountKey === accountKey;

                return (
                  <div key={accountKey} className="rounded-xl border border-slate-200 p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="text-sm font-medium text-slate-500">
                          {account.bankCodeStd} · {account.bankName ?? "은행명 없음"}
                        </div>
                        <div className="mt-1 text-lg font-semibold text-slate-900">
                          {account.accountAlias ?? account.accountHolderName ?? "등록 계좌"}
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                          핀테크이용번호: {account.fintechUseNum ?? "-"}
                          <br />
                          마스킹 계좌번호: {account.accountNumMasked ?? "-"}
                        </div>
                      </div>
                      <Button
                        text={isSaving ? "선택 저장 중..." : "이 계좌로 동기화"}
                        onClick={() => handleSelectRegisteredAccount(account)}
                        disabled={isSaving}
                        className="bg-emerald-700 hover:bg-emerald-800"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">계좌통합조회 결과</h2>
              <p className="mt-2 text-sm text-slate-600">
                현재 앱은 오픈뱅킹 계좌등록 콜백을 메인 흐름으로 사용합니다. 아래 조회는 별도 권한이 있는 경우에만 보조적으로 사용합니다.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {kftcAccounts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                아직 계좌통합조회 결과가 없습니다.
              </div>
            ) : (
              kftcAccounts.map((account) => {
                const accountKey = `${account.bankCodeStd ?? ""}-${account.accountNum ?? ""}-${account.accountSeq ?? ""}`;
                const isSaving = savingAccountKey === accountKey;

                return (
                  <div key={accountKey} className="rounded-xl border border-slate-200 p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="text-sm font-medium text-slate-500">
                          {account.bankCodeStd} · {account.activityType}
                        </div>
                        <div className="mt-1 text-lg font-semibold text-slate-900">
                          {account.productName ?? "계좌명 없음"}
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                          계좌번호: {account.accountNum}
                          <br />
                          회차번호: {account.accountSeq}
                          <br />
                          잔액: {account.balanceAmt ?? "-"}
                        </div>
                      </div>
                      <Button
                        text={isSaving ? "선택 저장 중..." : "동기화 계좌로 선택"}
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
        </div>
      </div>
    </div>
  );
};

export default CreateAccount;
