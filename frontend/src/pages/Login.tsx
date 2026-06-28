import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { login } from "../api/UserAPI";
import { loginSchema } from "../validations/authSchemas";
import { LoginFormData } from "../types";
import { handleApiError } from "../utils/errorHandler";
import { saveUserData, saveToken } from "../utils/storage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

const BRAND_FEATURES = [
  { icon: "⚡", text: "평균 350ms 실시간 이체" },
  { icon: "🤖", text: "AI 위험 거래 자동 탐지" },
  { icon: "📊", text: "맞춤형 소비 인사이트" },
] as const;

// ─── AuthBanner ───────────────────────────────────────────────────────────────

interface AuthBannerProps {
  onLogoClick: () => void;
}

function AuthBanner({ onLogoClick }: AuthBannerProps) {
  return (
    <div
      className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
      style={{
        background: "linear-gradient(145deg, #0f172a 0%, #1e3a8a 55%, #1d4ed8 100%)",
      }}
    >
      {/* Decorative blobs */}
      <div
        className="absolute -top-16 -right-16 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: "rgba(8,145,178,.14)" }}
      />
      <div
        className="absolute bottom-10 -left-10 w-52 h-52 rounded-full pointer-events-none"
        style={{ background: "rgba(30,58,138,.28)" }}
      />

      {/* Logo */}
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

      {/* Main copy */}
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

      {/* Copyright */}
      <p className="relative z-10 text-xs" style={{ color: "rgba(255,255,255,.35)" }}>
        © 2026 EzPay Inc. 금융위원회 등록 전자금융업자
      </p>
    </div>
  );
}

// ─── Eye icon toggle ──────────────────────────────────────────────────────────

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// ─── LoginForm ────────────────────────────────────────────────────────────────

function LoginForm() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [keepLogin, setKeepLogin] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ resolver: yupResolver(loginSchema) });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setServerError("");

    try {
      const res = await login(data);

      if (res.status === "success" && res.data?.userId) {
        const userRole = res.data.role || "USER";

        if (res.data.token) {
          saveToken(res.data.token, keepLogin);
        }
        saveUserData(
          { userId: res.data.userId, email: res.data.email, name: res.data.name, role: userRole },
          keepLogin
        );

        navigate(userRole === "ADMIN" ? "/admin/dashboard" : "/dashboard");
      } else {
        setServerError("로그인에 실패했습니다.");
      }
    } catch (err: unknown) {
      setServerError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Spring Boot OAuth2 endpoints — redirects user to provider authorization page
  const handleKakaoLogin = () => {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/kakao`;
  };

  const handleNaverLogin = () => {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/naver`;
  };

  return (
    <div className="flex flex-col justify-center px-8 sm:px-16 py-16 bg-white min-h-screen lg:min-h-0">
      <div className="w-full max-w-sm mx-auto">

        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">다시 오셨군요</h1>
          <p className="text-sm text-gray-500 mt-1">
            계정에 로그인하여 금융 대시보드를 확인하세요.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
              이메일 <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="이메일 주소 입력"
              {...register("email")}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              className={[
                "w-full px-4 py-3 rounded-xl border text-sm transition-colors outline-none",
                "focus:ring-2 focus:ring-gray-900 focus:border-transparent",
                errors.email
                  ? "border-red-400 bg-red-50 focus:ring-red-400"
                  : "border-gray-200 hover:border-gray-300 bg-white",
              ].join(" ")}
            />
            {errors.email && (
              <p id="email-error" role="alert" className="mt-1.5 text-xs text-red-500">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
              비밀번호 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="비밀번호 입력"
                {...register("password")}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
                className={[
                  "w-full px-4 py-3 pr-20 rounded-xl border text-sm transition-colors outline-none",
                  "focus:ring-2 focus:ring-gray-900 focus:border-transparent",
                  errors.password
                    ? "border-red-400 bg-red-50 focus:ring-red-400"
                    : "border-gray-200 hover:border-gray-300 bg-white",
                ].join(" ")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors"
                aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 표시"}
              >
                <EyeIcon visible={showPassword} />
                <span>{showPassword ? "숨기기" : "표시"}</span>
              </button>
            </div>
            {errors.password && (
              <p id="password-error" role="alert" className="mt-1.5 text-xs text-red-500">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Keep-login + Forgot password */}
          <div className="flex items-center justify-between pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={keepLogin}
                onChange={(e) => setKeepLogin(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
              />
              <span className="text-xs text-gray-600">로그인 유지하기</span>
            </label>
            <button
              type="button"
              onClick={() => navigate("/find-password")}
              className="text-xs text-blue-600 hover:underline focus:outline-none"
            >
              비밀번호 찾기
            </button>
          </div>

          {/* Server-side error */}
          {serverError && (
            <div
              role="alert"
              aria-live="polite"
              className="text-xs text-red-600 bg-red-50 rounded-xl px-4 py-3 border border-red-100"
            >
              {serverError}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className={[
              "w-full py-3 rounded-xl text-sm font-semibold transition-all mt-2",
              "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900",
              isLoading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-gray-900 text-white hover:bg-gray-700 active:scale-[0.98]",
            ].join(" ")}
            aria-label={isLoading ? "로그인 진행 중" : "로그인"}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                로그인 중...
              </span>
            ) : (
              "로그인"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center" aria-hidden>
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-white text-xs text-gray-400">또는</span>
          </div>
        </div>

        {/* Social login */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleKakaoLogin}
            className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300"
          >
            <span
              className="w-5 h-5 rounded flex items-center justify-center text-xs flex-shrink-0"
              style={{ background: "#FEE500" }}
              aria-hidden
            >
              💬
            </span>
            카카오로 계속하기
          </button>

          <button
            type="button"
            onClick={handleNaverLogin}
            className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300"
          >
            <span
              className="inline-flex items-center justify-center w-5 h-5 rounded text-white text-xs font-black flex-shrink-0"
              style={{ background: "#03C75A" }}
              aria-hidden
            >
              N
            </span>
            네이버로 계속하기
          </button>
        </div>

        {/* Sign-up link */}
        <p className="text-center text-sm text-gray-500 mt-7">
          계정이 없으신가요?{" "}
          <button
            type="button"
            onClick={() => navigate("/signup")}
            className="font-semibold text-blue-600 hover:underline focus:outline-none"
          >
            회원가입
          </button>
        </p>

        {/* Terms fine print */}
        <p className="text-center text-xs text-gray-400 mt-3 leading-relaxed">
          로그인하면 EzPay의{" "}
          <button type="button" className="underline hover:text-gray-600 focus:outline-none">
            이용약관
          </button>{" "}
          및{" "}
          <button type="button" className="underline hover:text-gray-600 focus:outline-none">
            개인정보처리방침
          </button>
          에 동의하게 됩니다.
        </p>
      </div>
    </div>
  );
}

// ─── Login (page) ─────────────────────────────────────────────────────────────

const Login: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <AuthBanner onLogoClick={() => navigate("/")} />
      <LoginForm />
    </div>
  );
};

export default Login;
