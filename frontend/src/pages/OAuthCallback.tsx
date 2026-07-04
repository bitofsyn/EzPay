import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { oauthLogin } from "../api/UserAPI";
import { consumeState, getRedirectUri, OAuthProvider } from "../utils/oauth";
import { saveUserData, saveToken } from "../utils/storage";
import { handleApiError } from "../utils/errorHandler";

const PROVIDER_LABEL: Record<OAuthProvider, string> = {
  kakao: "카카오",
  naver: "네이버",
};

/**
 * 소셜 로그인 콜백 페이지 (/oauth/callback/:provider)
 * 제공자가 리다이렉트하며 붙여준 code/state 를 받아 백엔드로 전달하고,
 * 일반 로그인과 동일하게 token/user 를 저장한 뒤 대시보드로 이동한다.
 */
const OAuthCallback: React.FC = () => {
  const { provider } = useParams<{ provider: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [error, setError] = useState<string>("");
  // React 18 StrictMode(개발)에서 effect 가 2번 실행돼 code 가 중복 소비되는 것을 방지
  const processedRef = useRef(false);

  const isSupportedProvider = provider === "kakao" || provider === "naver";
  const providerLabel = isSupportedProvider ? PROVIDER_LABEL[provider as OAuthProvider] : "소셜";

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const run = async () => {
      if (!isSupportedProvider) {
        setError("지원하지 않는 소셜 로그인입니다.");
        return;
      }

      const code = searchParams.get("code");
      const returnedState = searchParams.get("state");
      // 제공자가 사용자 거부/오류 시 error 파라미터를 붙여 돌아온다.
      const oauthError = searchParams.get("error");

      const savedState = consumeState();

      if (oauthError) {
        setError(`${providerLabel} 인증이 취소되었거나 실패했습니다.`);
        return;
      }

      if (!code) {
        setError("인가 코드를 받지 못했습니다. 다시 시도해주세요.");
        return;
      }

      // CSRF 방지: 요청 때 저장한 state 와 콜백 state 가 일치해야 한다.
      if (!savedState || savedState !== returnedState) {
        setError("보안 검증에 실패했습니다. 처음부터 다시 로그인해주세요.");
        return;
      }

      try {
        const res = await oauthLogin(provider as OAuthProvider, {
          code,
          state: returnedState,
          redirectUri: getRedirectUri(provider as OAuthProvider),
        });

        if (res.status === "success" && res.data?.userId) {
          const userRole = res.data.role || "USER";

          // 소셜 로그인은 세션 유지(브라우저 종료 시까지) 기준으로 저장
          if (res.data.token) {
            saveToken(res.data.token, true);
          }
          saveUserData(
            {
              userId: res.data.userId,
              email: res.data.email,
              name: res.data.name,
              role: userRole,
            },
            true
          );

          navigate(userRole === "ADMIN" ? "/admin/dashboard" : "/dashboard", {
            replace: true,
          });
        } else {
          setError("로그인에 실패했습니다.");
        }
      } catch (err: unknown) {
        setError(handleApiError(err));
      }
    };

    run();
  }, [isSupportedProvider, providerLabel, provider, searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm text-center">
        {error ? (
          <div style={{ animation: "ezpay-fadeIn 0.22s ease" }}>
            <div className="mx-auto mb-5 w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-gray-900 mb-1.5">{providerLabel} 로그인 실패</h1>
            <p className="text-sm text-gray-500 mb-6">{error}</p>
            <button
              type="button"
              onClick={() => navigate("/login", { replace: true })}
              className="w-full py-3 rounded-xl text-sm font-semibold bg-gray-900 text-white hover:bg-gray-700 transition-all active:scale-[0.98]"
            >
              로그인 화면으로 돌아가기
            </button>
          </div>
        ) : (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4" />
            <p className="text-gray-600 text-sm">{providerLabel} 계정으로 로그인 중...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback;
