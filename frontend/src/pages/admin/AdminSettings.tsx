import React, { useState } from "react";
import {
  FiBell,
  FiGlobe,
  FiInfo,
  FiShield,
  FiUser,
} from "react-icons/fi";
import AdminShell from "../../components/admin/AdminShell";
import { ToggleSwitch } from "../../components/admin/AdminUI";
import AdminAccount from "./settings/AdminAccount";
import NotificationSettings from "./settings/NotificationSettings";
import SecuritySettings from "./settings/SecuritySettings";
import SystemInfo from "./settings/SystemInfo";

// ─── Nav tabs ─────────────────────────────────────────────────────────────────

type NavTab = "일반 설정" | "관리자 계정" | "알림 설정" | "보안 설정" | "시스템 정보";

const NAV_TABS: { label: NavTab; Icon: React.FC<{ size?: number }> }[] = [
  { label: "일반 설정", Icon: FiGlobe },
  { label: "관리자 계정", Icon: FiUser },
  { label: "알림 설정", Icon: FiBell },
  { label: "보안 설정", Icon: FiShield },
  { label: "시스템 정보", Icon: FiInfo },
];

// ─── Component ────────────────────────────────────────────────────────────────

const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>("일반 설정");

  // Form state
  const [serviceName, setServiceName] = useState("EzPay");
  const [supportEmail, setSupportEmail] = useState("support@ezpay.com");
  const [contact, setContact] = useState("1588-0000");

  // Toggle state
  const [serviceActive, setServiceActive] = useState(true);
  const [signupAllowed, setSignupAllowed] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  return (
    <AdminShell title="설정">
      <div className="grid gap-6 xl:grid-cols-[200px_1fr]">
        {/* Left Nav */}
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-3 h-fit">
          <nav className="space-y-1">
            {NAV_TABS.map(({ label, Icon }) => (
              <button
                key={label}
                onClick={() => setActiveTab(label)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition text-left ${
                  activeTab === label
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right Content */}
        <div className="space-y-5">
          {activeTab === "일반 설정" && (
            <>
              {/* 서비스 기본 설정 */}
              <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
                <h3 className="text-sm font-bold text-slate-800 mb-5">서비스 기본 설정</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="settings-service-name" className="text-xs font-semibold text-slate-500 block mb-1.5">서비스명</label>
                    <input
                      id="settings-service-name"
                      type="text"
                      value={serviceName}
                      onChange={(e) => setServiceName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-300"
                    />
                  </div>
                  <div>
                    <label htmlFor="settings-support-email" className="text-xs font-semibold text-slate-500 block mb-1.5">고객센터 이메일</label>
                    <input
                      id="settings-support-email"
                      type="email"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-300"
                    />
                  </div>
                  <div>
                    <label htmlFor="settings-contact" className="text-xs font-semibold text-slate-500 block mb-1.5">연락처</label>
                    <input
                      id="settings-contact"
                      type="text"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-300"
                    />
                  </div>
                  <div className="pt-2 flex justify-end">
                    <button className="rounded-xl bg-slate-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-slate-800 transition-colors">
                      저장
                    </button>
                  </div>
                </div>
              </div>

              {/* 서비스 운영 상태 */}
              <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
                <h3 className="text-sm font-bold text-slate-800 mb-5">서비스 운영 상태</h3>
                <div className="space-y-5">
                  {[
                    {
                      label: "서비스 활성화",
                      sub: "서비스 전체 활성화 여부",
                      checked: serviceActive,
                      onChange: setServiceActive,
                    },
                    {
                      label: "신규 회원가입 허용",
                      sub: "신규 사용자의 회원가입 허용 여부",
                      checked: signupAllowed,
                      onChange: setSignupAllowed,
                    },
                    {
                      label: "시스템 점검 모드",
                      sub: "점검 모드 활성화 시 일반 사용자 접근 차단",
                      checked: maintenanceMode,
                      onChange: setMaintenanceMode,
                    },
                  ].map(({ label, sub, checked, onChange }) => (
                    <div key={label} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
                      </div>
                      <ToggleSwitch checked={checked} onChange={onChange} />
                    </div>
                  ))}
                </div>
              </div>

              {/* 관리자 활동 로그 */}
              <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">관리자 활동 로그</h3>
                  <span className="text-xs text-slate-400">0건</span>
                </div>
                <div className="px-5 py-12 text-center text-sm text-slate-400">
                  기록된 관리자 활동이 없습니다.
                </div>
              </div>
            </>
          )}

          {activeTab === "관리자 계정" && <AdminAccount />}
          {activeTab === "알림 설정" && <NotificationSettings />}
          {activeTab === "보안 설정" && <SecuritySettings />}
          {activeTab === "시스템 정보" && <SystemInfo />}
        </div>
      </div>
    </AdminShell>
  );
};

export default AdminSettings;
