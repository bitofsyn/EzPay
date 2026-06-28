import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

// ─── Logo ───────────────────────────────────────────────────────────────────

interface LogoProps {
  size?: number;
  light?: boolean;
}

function Logo({ size = 28, light = false }: LogoProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.3),
          background: light ? "rgba(255,255,255,.15)" : "#0f172a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24">
          <path
            d="M7 12 L17 7 L13.5 12 L17 17 Z"
            fill={light ? "#fff" : "#22d3ee"}
          />
        </svg>
      </div>
      <span
        style={{
          fontSize: size * 0.65,
          fontWeight: 900,
          color: light ? "#fff" : "#0f172a",
          letterSpacing: "-0.5px",
        }}
      >
        EzPay
      </span>
    </div>
  );
}

// ─── Constants ──────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: "⚡",
    title: "실시간 이체",
    desc: "계좌 잔액 검증부터 원장 반영까지 평균 350ms — 기다림 없는 송금",
  },
  {
    icon: "🤖",
    title: "AI 위험도 분석",
    desc: "매 거래마다 AI가 수취인·금액·패턴을 분석해 사기 거래를 사전 차단",
  },
  {
    icon: "📊",
    title: "자산 인사이트",
    desc: "지출 패턴을 학습해 주간·월간 소비 리포트와 맞춤 절약 팁 제공",
  },
  {
    icon: "🔒",
    title: "은행급 보안",
    desc: "256bit 암호화·이중 원장·실시간 이상거래 탐지로 자산을 보호",
  },
] as const;

const STATS = [
  { n: "베타 운영 중", l: "서비스 상태" },
  { n: "99.98%", l: "서비스 가동률" },
  { n: "350ms", l: "평균 처리 시간" },
  { n: "2026.06", l: "서비스 출시" },
] as const;

const RECENT_TRANSACTIONS = [
  { name: "카페 정산", amt: "-₩4,500", time: "방금", color: "#fca5a5" },
  { name: "이지현 입금", amt: "+₩35,000", time: "1시간", color: "#6ee7b7" },
  { name: "편의점", amt: "-₩12,800", time: "3시간", color: "#fca5a5" },
] as const;

const MINI_BAR_HEIGHTS = [40, 55, 35, 70, 60, 80, 90] as const;

const BRAND_FEATURES = [
  { icon: "⚡", text: "평균 350ms 실시간 이체" },
  { icon: "🤖", text: "AI 위험 거래 자동 탐지" },
  { icon: "📊", text: "맞춤형 소비 인사이트" },
] as const;

// ─── Sub-sections ───────────────────────────────────────────────────────────

function NavBar({
  onLogin,
  onSignup,
}: {
  onLogin: () => void;
  onSignup: () => void;
}) {
  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(255,255,255,.9)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #f1f5f9",
        padding: "0 max(24px, calc((100% - 1120px)/2))",
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Logo size={26} />
      <div />
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          onClick={onLogin}
          style={{
            padding: "8px 18px",
            border: "1.5px solid #e2e8f0",
            borderRadius: 10,
            background: "#fff",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            color: "#334155",
            transition: "background .15s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "#f8fafc")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "#fff")
          }
        >
          로그인
        </button>
        <button
          onClick={onSignup}
          style={{
            padding: "8px 18px",
            border: "none",
            borderRadius: 10,
            background: "#0f172a",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            transition: "opacity .15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = ".85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          회원가입
        </button>
      </div>
    </nav>
  );
}

function HeroMockupCard() {
  return (
    <div
      style={{
        background: "rgba(255,255,255,.07)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,.14)",
        borderRadius: 24,
        padding: 24,
        boxShadow: "0 24px 80px rgba(0,0,0,.3)",
      }}
    >
      {/* 총 보유 자산 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 18,
        }}
      >
        <div>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,.6)" }}>
            총 보유 자산
          </p>
          <p
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: "#fff",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            ₩6,704,000
          </p>
          <p style={{ fontSize: 11, color: "#6ee7b7", marginTop: 3 }}>
            ↑ 12.5% 전월 대비
          </p>
        </div>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "rgba(255,255,255,.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,.8)"
            strokeWidth="2"
          >
            <path d="M7 12l5-5 5 5M7 17l5-5 5 5" />
          </svg>
        </div>
      </div>

      {/* 미니 바차트 */}
      <div
        style={{
          display: "flex",
          gap: 4,
          alignItems: "flex-end",
          height: 48,
          marginBottom: 16,
        }}
      >
        {MINI_BAR_HEIGHTS.map((h, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              borderRadius: "3px 3px 0 0",
              background:
                i === MINI_BAR_HEIGHTS.length - 1
                  ? "#38bdf8"
                  : "rgba(255,255,255,.2)",
              height: `${h}%`,
              transition: "height .5s ease",
            }}
          />
        ))}
      </div>

      {/* 최근 거래 */}
      {RECENT_TRANSACTIONS.map((t) => (
        <div
          key={t.name}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 0",
            borderBottom: "1px solid rgba(255,255,255,.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "rgba(255,255,255,.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
              }}
            >
              {t.name[0]}
            </div>
            <div>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "rgba(255,255,255,.9)",
                }}
              >
                {t.name}
              </p>
              <p
                style={{
                  fontSize: 9,
                  color: "rgba(255,255,255,.45)",
                  marginTop: 1,
                }}
              >
                {t.time} 전
              </p>
            </div>
          </div>
          <p style={{ fontSize: 12, fontWeight: 700, color: t.color }}>
            {t.amt}
          </p>
        </div>
      ))}
    </div>
  );
}

function HeroSection({
  onLogin,
  onSignup,
}: {
  onLogin: () => void;
  onSignup: () => void;
}) {
  return (
    <section
      className="home-hero-bg"
      style={{
        padding: "80px max(24px, calc((100% - 1120px)/2)) 80px",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* 배경 장식 */}
      <div
        style={{
          position: "absolute",
          top: -80,
          right: -80,
          width: 480,
          height: 480,
          borderRadius: "50%",
          background: "rgba(8,145,178,.12)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -60,
          left: 80,
          width: 280,
          height: 280,
          borderRadius: "50%",
          background: "rgba(30,58,138,.3)",
          pointerEvents: "none",
        }}
      />

      {/* 좌측 텍스트 */}
      <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
        <div
          className="home-fade-up"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(255,255,255,.12)",
            border: "1px solid rgba(255,255,255,.2)",
            borderRadius: 20,
            padding: "5px 14px",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#10b981",
              animation: "home-pulse 1.5s ease infinite",
            }}
          />
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "rgba(255,255,255,.85)",
            }}
          >
            AI 위험도 분석 탑재 · 2026 신규 출시
          </span>
        </div>

        <h1
          className="home-fade-up"
          style={{
            fontSize: "clamp(36px,5vw,64px)",
            fontWeight: 900,
            color: "#fff",
            lineHeight: 1.15,
            marginBottom: 20,
            letterSpacing: "-1.5px",
            animationDelay: ".06s",
          }}
        >
          돈 관리의
          <br />
          <span
            style={{
              background: "linear-gradient(90deg,#22d3ee,#38bdf8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            새로운 기준
          </span>
        </h1>

        <p
          className="home-fade-up"
          style={{
            fontSize: 17,
            color: "rgba(255,255,255,.72)",
            lineHeight: 1.7,
            maxWidth: 500,
            marginBottom: 36,
            animationDelay: ".12s",
          }}
        >
          실시간 이체, AI 소비 분석, 통합 자산 관리까지.
          <br />
          EzPay 하나로 금융 생활을 단순하게.
        </p>

        <div
          className="home-fade-up"
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            animationDelay: ".18s",
          }}
        >
          <button
            onClick={onLogin}
            style={{
              padding: "14px 32px",
              background: "#fff",
              color: "#0f172a",
              border: "none",
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 800,
              cursor: "pointer",
              transition: "transform .15s,opacity .15s",
              boxShadow: "0 4px 20px rgba(0,0,0,.25)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "translateY(-2px)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform = "none")
            }
          >
            로그인
          </button>
          <button
            onClick={onSignup}
            style={{
              padding: "14px 28px",
              background: "rgba(255,255,255,.15)",
              border: "1.5px solid rgba(255,255,255,.3)",
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 700,
              color: "#fff",
              cursor: "pointer",
              transition: "background .15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,.22)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,.15)")
            }
          >
            회원가입
          </button>
        </div>

        {/* 통계 */}
        <div
          className="home-fade-up"
          style={{
            display: "flex",
            gap: 14,
            marginTop: 52,
            flexWrap: "wrap",
            animationDelay: ".24s",
          }}
        >
          {STATS.map((s) => (
            <div key={s.n} className="home-stat-pill">
              <p style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>
                {s.n}
              </p>
              <p
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,.6)",
                  marginTop: 2,
                }}
              >
                {s.l}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 우측 목업 카드 */}
      <div
        className="home-fade-in"
        style={{
          flexShrink: 0,
          width: "clamp(280px,38%,440px)",
          marginLeft: 60,
          position: "relative",
          zIndex: 1,
        }}
      >
        <HeroMockupCard />

        {/* 플로팅 배지 */}
        <div
          style={{
            position: "absolute",
            top: -16,
            right: -16,
            background: "#10b981",
            color: "#fff",
            borderRadius: 12,
            padding: "8px 14px",
            fontSize: 11,
            fontWeight: 700,
            boxShadow: "0 6px 20px rgba(16,185,129,.35)",
            animation: "home-fadeUp .6s ease .3s both",
          }}
        >
          ✓ AI 안전 거래
        </div>
        <div
          style={{
            position: "absolute",
            bottom: -14,
            left: -14,
            background: "#fff",
            color: "#0f172a",
            borderRadius: 12,
            padding: "8px 14px",
            fontSize: 11,
            fontWeight: 700,
            boxShadow: "0 6px 20px rgba(0,0,0,.15)",
            animation: "home-fadeUp .6s ease .45s both",
          }}
        >
          ⚡ 352ms 처리완료
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section
      style={{
        padding: "80px max(24px, calc((100% - 1120px)/2))",
        background: "#fff",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 52 }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#0891b2",
            textTransform: "uppercase",
            letterSpacing: "2px",
          }}
        >
          Why EzPay
        </span>
        <h2
          style={{
            fontSize: "clamp(28px,4vw,44px)",
            fontWeight: 900,
            marginTop: 10,
            letterSpacing: "-1px",
          }}
        >
          금융이 이렇게 간단해도 됩니다
        </h2>
        <p
          style={{
            fontSize: 16,
            color: "#64748b",
            marginTop: 14,
            lineHeight: 1.7,
          }}
        >
          복잡한 절차 없이, 필요한 기능만 모아
          <br />
          진짜 필요한 금융 경험을 만들었습니다.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
          gap: 20,
        }}
      >
        {FEATURES.map((f, i) => (
          <div
            key={f.title}
            className="home-feature-card"
            style={{ animationDelay: `${i * 0.07}s` }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "#f0f9ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                marginBottom: 14,
              }}
            >
              {f.icon}
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>
              {f.title}
            </h3>
            <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.65 }}>
              {f.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function BrandPanel({ onLanding }: { onLanding: () => void }) {
  return (
    <div
      className="home-hero-bg"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 48,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -60,
          right: -60,
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: "rgba(8,145,178,.14)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: -40,
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: "rgba(30,58,138,.25)",
        }}
      />
      <button
        onClick={onLanding}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          alignSelf: "flex-start",
          position: "relative",
          zIndex: 1,
        }}
      >
        <Logo size={28} light />
      </button>
      <div style={{ position: "relative", zIndex: 1 }}>
        <h2
          style={{
            fontSize: 36,
            fontWeight: 900,
            color: "#fff",
            lineHeight: 1.25,
            letterSpacing: "-1px",
            marginBottom: 16,
          }}
        >
          더 쉬운 금융,
          <br />더 안전한 자산
        </h2>
        <p
          style={{
            fontSize: 15,
            color: "rgba(255,255,255,.65)",
            lineHeight: 1.75,
            marginBottom: 36,
          }}
        >
          실시간 이체부터 AI 소비 분석까지
          <br />
          EzPay 하나로 완성됩니다.
        </p>
        {BRAND_FEATURES.map((f) => (
          <div
            key={f.text}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                background: "rgba(255,255,255,.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 15,
              }}
            >
              {f.icon}
            </div>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "rgba(255,255,255,.85)",
              }}
            >
              {f.text}
            </span>
          </div>
        ))}
      </div>
      <p
        style={{
          fontSize: 11,
          color: "rgba(255,255,255,.35)",
          position: "relative",
          zIndex: 1,
        }}
      >
        © 2026 EzPay Inc. 금융위원회 등록 전자금융업자
      </p>
    </div>
  );
}

function HomeFooter() {
  return (
    <footer
      style={{
        padding: "32px max(24px, calc((100% - 1120px)/2))",
        borderTop: "1px solid #f1f5f9",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
        background: "#fff",
      }}
    >
      <Logo size={22} />
      <p style={{ fontSize: 12, color: "#94a3b8" }}>
        © 2026 EzPay. 고객 자산을 안전하게 지킵니다.
      </p>
      <div style={{ display: "flex", gap: 20 }}>
        {["이용약관", "개인정보처리방침", "고객센터"].map((t) => (
          <button
            key={t}
            style={{
              fontSize: 12,
              color: "#94a3b8",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            {t}
          </button>
        ))}
      </div>
    </footer>
  );
}

// ─── Home (Landing Page) ────────────────────────────────────────────────────

const Home: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const user =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    if (user) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const goLogin = () => navigate("/login");
  const goSignup = () => navigate("/signup");
  const goTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div
      className="home-root"
      style={{ minHeight: "100vh", overflowY: "auto", background: "#fff" }}
    >
      <NavBar onLogin={goLogin} onSignup={goSignup} />
      <HeroSection onLogin={goLogin} onSignup={goSignup} />
      <FeaturesSection />
      <HomeFooter />

    </div>
  );
};

export { Logo, BrandPanel };
export default Home;
