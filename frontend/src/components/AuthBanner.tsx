import React from "react";

const BRAND_FEATURES = [
  { icon: "⚡", text: "평균 350ms 실시간 이체" },
  { icon: "🤖", text: "AI 위험 거래 자동 탐지" },
  { icon: "📊", text: "맞춤형 소비 인사이트" },
] as const;

interface AuthBannerProps {
  onLogoClick: () => void;
}

const AuthBanner: React.FC<AuthBannerProps> = ({ onLogoClick }) => {
  return (
    <div
      className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
      style={{ background: "linear-gradient(145deg, #0f172a 0%, #1e3a8a 55%, #1d4ed8 100%)" }}
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
};

export default AuthBanner;
