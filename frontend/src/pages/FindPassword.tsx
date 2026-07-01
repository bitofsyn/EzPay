import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { requestPasswordReset } from "../api/UserAPI";

const BRAND_FEATURES = [
  { icon: "⚡", text: "평균 350ms 실시간 이체" },
  { icon: "🤖", text: "AI 위험 거래 자동 탐지" },
  { icon: "📊", text: "맞춤형 소비 인사이트" },
] as const;

// ─── AuthBanner ───────────────────────────────────────────────────────────────

function AuthBanner({ onLogoClick }: { onLogoClick: () => void }) {
  return (
    <div
      className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
      style={{
        background: "linear-gradient(145deg, #0f172a 0%, #1e3a8a 55%, #1d4ed8 100%)",
      }}
    >
      <div
        className="absolute -top-16 -right-16 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: "rgba(8,145,178,.14)" }}
      />
      <div
        className="absolute bottom-10 -left-10 w-52 h-52 rounded-full pointer-events-none"
        style={{ background: "rgba(30,58,138,.28)" }}
      />

      <button
        type="button"
        onClick={onLogoClick}
        className="relative z-10 flex items-center gap-2 self-start bg-transparent border-0 cursor-pointer p-0"
        aria-label="EzPay 홈으로 이동"
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(255,255,255,.15)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
            <path d="M7 12 L17 7 L13.5 12 L17 17 Z" fill="#fff" />
          </svg>
        </div>
        <span className="text-white font-black text-lg tracking-tight">EzPay</span>
      </button>

      <div className="relative z-10">
        <h2 className="text-4xl font-black text-white leading-snug tracking-tight mb-4">
          더 쉬운 금융,
          <br />더 안전한 자산
        </h2>
        <p className="text-sm leading-relaxed mb-9" style={{ color: "rgba(255,255,255,.65)" }}>
          실시간 이체부터 AI 소비 분석까지
          <br />
          EzPay 하나로 완성됩니다.
        </p>
        <ul className="space-y-3">
          {BRAND_FEATURES.map((f) => (
            <li key={f.text} className="flex items-center gap-3">
              <span
                className="w-8 h-8 rounded-[9px] flex items-center justify-center text-sm flex-shrink-0"
                style={{ background: "rgba(255,255,255,.12)" }}
              >
                {f.icon}
              </span>
              <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,.85)" }}>
                {f.text}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative z-10 text-xs" style={{ color: "rgba(255,255,255,.35)" }}>
        © 2026 EzPay Inc. 금융위원회 등록 전자금융업자
      </p>
    </div>
  );
}

// ─── MailIcon ─────────────────────────────────────────────────────────────────

function MailIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 7l10 7 10-7" />
    </svg>
  );
}

// ─── LoadingSpinner ───────────────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

// ─── FindPasswordForm ─────────────────────────────────────────────────────────

function FindPasswordForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  const canSubmit = isValidEmail(email) && !isLoading;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsLoading(true);
    setError("");

    try {
      const res = await requestPasswordReset(email.trim());
      const token = res.data as string;
      sessionStorage.setItem("resetToken", token);
      navigate("/reset-password");
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as Record<string, unknown>;
        const response = axiosError.response as Record<string, unknown> | undefined;
        const data = response?.data as Record<string, unknown> | undefined;
        setError(String(data?.message ?? "비밀번호 재설정 요청에 실패했습니다."));
      } else {
        setError("비밀번호 재설정 요청에 실패했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center px-8 sm:px-16 py-16 bg-white min-h-screen lg:min-h-0">
      <div className="w-full max-w-sm mx-auto animate-[fadeIn_.35s_ease]">

        {/* Mail icon */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
          style={{ background: "#eff6ff", color: "#2563eb" }}
        >
          <MailIcon />
        </div>

        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">비밀번호 찾기</h1>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            가입하신 이메일 주소를 입력하시면
            <br />
            비밀번호 재설정 링크를 보내드립니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">

          {/* Email input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
              이메일 주소 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3.5 flex items-center text-gray-400 pointer-events-none">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M2 7l10 7 10-7" />
                </svg>
              </span>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="example@email.com"
                value={email}
                onChange={handleChange}
                onKeyDown={(e) => e.key === "Enter" && canSubmit && (e.currentTarget.form as HTMLFormElement)?.requestSubmit()}
                aria-invalid={!!error}
                aria-describedby={error ? "email-error" : "email-hint"}
                className={[
                  "w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-colors outline-none",
                  "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent",
                  error
                    ? "border-red-400 bg-red-50 focus-visible:ring-red-400"
                    : "border-gray-200 hover:border-gray-300 bg-white",
                ].join(" ")}
              />
            </div>
            {error ? (
              <p id="email-error" role="alert" className="mt-1.5 text-xs text-red-500">
                {error}
              </p>
            ) : (
              <p id="email-hint" className="mt-1.5 text-xs text-gray-400">
                가입 시 사용한 이메일을 입력해주세요.
              </p>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={!canSubmit}
            aria-label={isLoading ? "메일 전송 중" : "재설정 메일 보내기"}
            className={[
              "w-full py-3 rounded-xl text-sm font-semibold transition-all mt-1",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500",
              canSubmit
                ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] cursor-pointer"
                : "bg-gray-200 text-gray-400 cursor-not-allowed",
            ].join(" ")}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingSpinner />
                전송 중...
              </span>
            ) : (
              "재설정 메일 보내기"
            )}
          </button>
        </form>

        {/* Info box */}
        <div className="mt-5 flex gap-3 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3.5">
          <span className="text-base flex-shrink-0 mt-0.5">💡</span>
          <p className="text-xs text-gray-500 leading-relaxed">
            메일을 받지 못하셨나요? <strong className="text-gray-700">스팸함</strong>도 함께
            확인해 주세요. 문제가 지속되면{" "}
            <strong className="text-gray-700">고객센터</strong>로 문의해주세요.
          </p>
        </div>

        {/* Back to login */}
        <div className="mt-7 text-center">
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors focus-visible:outline-none focus-visible:underline"
            aria-label="로그인 페이지로 이동"
          >
            ← 로그인으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── FindPassword (page) ──────────────────────────────────────────────────────

const FindPassword: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <AuthBanner onLogoClick={() => navigate("/")} />
      <FindPasswordForm />
    </div>
  );
};

export default FindPassword;
