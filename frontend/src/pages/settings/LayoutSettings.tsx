import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  Bot,
  Camera,
  ChevronRight,
  CreditCard,
  History,
  Loader2,
  LogOut,
  Mail,
  Settings,
  Shield,
  ShieldAlert,
  Sparkles,
  UserCircle2,
  UserCog,
  UserRound,
} from "lucide-react";
import toast from "react-hot-toast";
import UserSidebar from "../../components/UserSidebar";
import {
  deleteUser,
  getLoginHistory,
  getMyAccounts,
  getNotificationSettings,
  getTransferLimit,
  getUserInfo,
  setMainAccount,
  updateNotificationSetting,
  updatePassword,
  updateTransferLimit,
  updateUserInfo,
} from "../../api/UserAPI";
import { Account, LoginHistoryItem, NotificationSettings, TransferLimit, User } from "../../types";
import { clearUserData, updateStoredUserData } from "../../utils/storage";
import { navigateToAdminDashboard } from "../../utils/adminView";

type SettingsSection =
  | "profile"
  | "security"
  | "notifications"
  | "ai"
  | "transfer"
  | "privacy"
  | "account";

type ProfileFormState = {
  name: string;
  email: string;
  phoneNumber: string;
};

type PasswordFormState = {
  newPassword: string;
  confirmPassword: string;
};

type ToggleItem = {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
};

const todayLabel = new Date().toLocaleDateString("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const sectionRouteMap: Record<string, SettingsSection> = {
  "": "profile",
  password: "security",
  notification: "notifications",
  ai: "ai",
  "transfer-limit": "transfer",
  "main-account": "transfer",
  privacy: "privacy",
  account: "account",
  "login-history": "security",
  withdraw: "account",
};

const sectionPathMap: Record<SettingsSection, string> = {
  profile: "/settings",
  security: "/settings/password",
  notifications: "/settings/notification",
  ai: "/settings/ai",
  transfer: "/settings/transfer-limit",
  privacy: "/settings/privacy",
  account: "/settings/account",
};

const settingMenus: Array<{
  id: SettingsSection;
  label: string;
  icon: typeof UserCog;
}> = [
  { id: "profile", label: "프로필 설정", icon: UserCog },
  { id: "security", label: "보안 설정", icon: Shield },
  { id: "notifications", label: "알림 설정", icon: Bell },
  { id: "ai", label: "AI 설정", icon: Sparkles },
  { id: "transfer", label: "송금 설정", icon: CreditCard },
  { id: "privacy", label: "개인정보 관리", icon: ShieldAlert },
  { id: "account", label: "계정 관리", icon: Settings },
];

const pageCardClassName =
  "rounded-[18px] border border-slate-100 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]";

const blockCardClassName =
  "rounded-[16px] border border-slate-100 bg-white px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]";

const inputClassName =
  "h-11 w-full rounded-[14px] border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-400 focus:bg-white focus-visible:ring-4 focus-visible:ring-slate-900/5";

const formatPhoneNumber = (value?: string) => {
  if (!value) return "";
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return value;
};

const formatAccountNumber = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return value;
};

const formatCurrencyInput = (value: number) => value.toLocaleString("ko-KR");

const normalizeAccounts = (items: Account[]) =>
  items.map((account) => ({
    ...account,
    isMain: account.isMain ?? (account as Account & { main?: boolean }).main ?? false,
  }));

const ToggleRow = ({ title, description, enabled, onToggle }: Omit<ToggleItem, "id">) => (
  <button
    type="button"
    onClick={onToggle}
    className="flex w-full items-center justify-between gap-4 py-4 text-left first:pt-0 last:pb-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-900/5"
  >
    <div>
      <p className="text-[15px] font-black text-slate-950">{title}</p>
      <p className="mt-1 text-xs font-medium text-slate-400">{description}</p>
    </div>
    <span className={`relative inline-flex h-7 w-14 shrink-0 items-center rounded-full transition ${enabled ? "bg-cyan-500" : "bg-slate-200"}`}>
      <span
        className={`absolute h-5 w-5 rounded-full bg-white shadow-[0_2px_8px_rgba(15,23,42,0.18)] transition ${
          enabled ? "translate-x-8" : "translate-x-1"
        }`}
      />
    </span>
  </button>
);

const SectionHeader = ({ title, description }: { title: string; description: string }) => (
  <div>
    <h2 className="text-[28px] font-black tracking-tight text-slate-950">{title}</h2>
    <p className="mt-1 text-sm font-medium text-slate-500">{description}</p>
  </div>
);

const LayoutSettings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileFormState>({ name: "", email: "", phoneNumber: "" });
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>({ newPassword: "", confirmPassword: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [isTransferSaving, setIsTransferSaving] = useState(false);
  const [isAccountSaving, setIsAccountSaving] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [aiRiskEmailEnabled, setAiRiskEmailEnabled] = useState(true);
  const [aiReportEmailEnabled, setAiReportEmailEnabled] = useState(false);
  const [aiAnalysisEnabled, setAiAnalysisEnabled] = useState(true);
  const [aiTransferRiskEnabled, setAiTransferRiskEnabled] = useState(true);
  const [aiCategoryEnabled, setAiCategoryEnabled] = useState(true);
  const [aiWeeklyReportEnabled, setAiWeeklyReportEnabled] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transferLimit, setTransferLimitState] = useState<TransferLimit | null>(null);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryItem[]>([]);

  const currentSection = useMemo<SettingsSection>(() => {
    const segment = location.pathname.replace(/^\/settings\/?/, "").split("/")[0] ?? "";
    return sectionRouteMap[segment] ?? "profile";
  }, [location.pathname]);

  const unreadCount = useMemo(() => {
    return [emailEnabled, pushEnabled, aiRiskEmailEnabled, aiReportEmailEnabled].filter((item) => !item).length;
  }, [aiReportEmailEnabled, aiRiskEmailEnabled, emailEnabled, pushEnabled]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const userInfo = await getUserInfo();
        setUser(userInfo);
        setProfileForm({
          name: userInfo.name ?? "",
          email: userInfo.email ?? "",
          phoneNumber: formatPhoneNumber(userInfo.phoneNumber),
        });

        const [notificationRes, limitRes, accountRes, loginRes] = await Promise.all([
          getNotificationSettings(userInfo.userId).catch(() => [] as NotificationSettings[]),
          getTransferLimit(userInfo.userId).catch(() => null),
          getMyAccounts().catch(() => [] as Account[]),
          getLoginHistory(userInfo.userId).catch(() => [] as LoginHistoryItem[]),
        ]);

        notificationRes.forEach((item) => {
          if (item.notificationType === "EMAIL") setEmailEnabled(item.isEnabled);
          if (item.notificationType === "PUSH") setPushEnabled(item.isEnabled);
        });

        setTransferLimitState(limitRes);
        setAccounts(normalizeAccounts(accountRes));
        setLoginHistory(loginRes);
      } catch (error) {
        console.error("설정 정보를 불러오지 못했습니다.", error);
        toast.error("설정 정보를 불러오지 못했습니다.");
        navigate("/login");
      } finally {
        setNotificationLoading(false);
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [navigate]);

  const handleSectionChange = (section: SettingsSection) => {
    navigate(sectionPathMap[section]);
  };

  const handleProfileChange =
    (field: keyof ProfileFormState) => (event: ChangeEvent<HTMLInputElement>) => {
      setProfileForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleProfileSave = async () => {
    if (!user) return;
    if (!profileForm.name.trim() || !profileForm.email.trim()) {
      toast.error("이름과 이메일을 입력해주세요.");
      return;
    }

    setIsProfileSaving(true);
    try {
      const updatedUser = await updateUserInfo(user.userId, {
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
      });
      setUser((prev) => (prev ? { ...prev, ...updatedUser } : updatedUser));
      setProfileForm((prev) => ({
        ...prev,
        name: updatedUser.name ?? prev.name,
        email: updatedUser.email ?? prev.email,
      }));
      updateStoredUserData({
        name: updatedUser.name ?? profileForm.name.trim(),
        email: updatedUser.email ?? profileForm.email.trim(),
      });
      toast.success("기본 정보를 저장했습니다.");
    } catch (error) {
      console.error("프로필 저장 실패", error);
      toast.error("기본 정보 저장에 실패했습니다.");
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handlePasswordChange =
    (field: keyof PasswordFormState) => (event: ChangeEvent<HTMLInputElement>) => {
      setPasswordForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handlePasswordSave = async () => {
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error("새 비밀번호를 모두 입력해주세요.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsPasswordSaving(true);
    try {
      const response = await updatePassword(passwordForm.newPassword);
      setPasswordForm({ newPassword: "", confirmPassword: "" });
      toast.success(response.message || "비밀번호를 변경했습니다.");
    } catch (error) {
      console.error("비밀번호 변경 실패", error);
      toast.error("비밀번호 변경에 실패했습니다.");
    } finally {
      setIsPasswordSaving(false);
    }
  };

  const handleNotificationToggle = async (type: "EMAIL" | "PUSH", currentValue: boolean) => {
    if (!user) return;

    try {
      await updateNotificationSetting(user.userId, type, !currentValue);
      if (type === "EMAIL") setEmailEnabled(!currentValue);
      if (type === "PUSH") setPushEnabled(!currentValue);
      toast.success("알림 설정을 변경했습니다.");
    } catch (error) {
      console.error("알림 설정 변경 실패", error);
      toast.error("알림 설정 변경에 실패했습니다.");
    }
  };

  const handleLimitInput =
    (field: "perTransactionLimit" | "dailyLimit") => (event: ChangeEvent<HTMLInputElement>) => {
      const numericValue = Number(event.target.value.replace(/\D/g, "")) || 0;
      setTransferLimitState((prev) =>
        prev
          ? { ...prev, [field]: numericValue }
          : { limitId: 0, userId: user?.userId ?? 0, perTransactionLimit: 0, dailyLimit: 0, [field]: numericValue }
      );
    };

  const handleTransferSave = async () => {
    if (!user || !transferLimit) return;

    setIsTransferSaving(true);
    try {
      await updateTransferLimit(user.userId, transferLimit.perTransactionLimit, transferLimit.dailyLimit);
      toast.success("송금 설정을 저장했습니다.");
    } catch (error) {
      console.error("송금 설정 저장 실패", error);
      toast.error("송금 설정 저장에 실패했습니다.");
    } finally {
      setIsTransferSaving(false);
    }
  };

  const handleSetMainAccount = async (accountId: number) => {
    try {
      await setMainAccount(accountId);
      const refreshed = normalizeAccounts(await getMyAccounts());
      setAccounts(refreshed);
      toast.success("대표 계좌를 변경했습니다.");
    } catch (error) {
      console.error("대표 계좌 변경 실패", error);
      toast.error("대표 계좌 변경에 실패했습니다.");
    }
  };

  const handleLogout = () => {
    clearUserData();
    navigate("/login");
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (!window.confirm("탈퇴 시 계정 정보가 삭제되며 복구할 수 없습니다. 계속하시겠습니까?")) return;

    setIsAccountSaving(true);
    try {
      await deleteUser(user.userId);
      clearUserData();
      toast.success("계정을 삭제했습니다.");
      navigate("/login");
    } catch (error) {
      console.error("계정 삭제 실패", error);
      toast.error("계정 삭제에 실패했습니다.");
    } finally {
      setIsAccountSaving(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <section className={`${pageCardClassName} flex min-h-[320px] items-center justify-center`}>
          <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
            <Loader2 size={18} className="animate-spin" />
            설정 정보를 불러오는 중입니다.
          </div>
        </section>
      );
    }

    if (currentSection === "profile") {
      return (
        <section className={pageCardClassName}>
          <SectionHeader title="프로필 설정" description="사용자 기본 정보와 프로필을 관리합니다." />

          <div className="mt-5 rounded-[16px] border border-slate-100 bg-slate-50 p-5">
            <p className="text-[15px] font-black text-slate-950">기본 정보</p>
            <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-slate-950 text-white shadow-[0_10px_26px_rgba(15,23,42,0.14)]">
                  <UserCircle2 size={38} />
                </div>
                <div>
                  <p className="text-[18px] font-black text-slate-950">{profileForm.name || "사용자"}</p>
                  <p className="mt-1 text-sm font-medium text-slate-500">{profileForm.email || "이메일 정보 없음"}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => toast("사진 변경 기능은 준비 중입니다.")}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-[14px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-900/5"
              >
                <Camera size={16} />
                사진 변경
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">이름</span>
                <input value={profileForm.name} onChange={handleProfileChange("name")} className={inputClassName} />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">이메일</span>
                <input value={profileForm.email} onChange={handleProfileChange("email")} className={inputClassName} />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-slate-700">전화번호</span>
                <input value={profileForm.phoneNumber} readOnly className={`${inputClassName} cursor-not-allowed bg-slate-100 text-slate-500`} />
                <span className="mt-2 block text-xs font-medium text-slate-400">전화번호 변경 기능은 추후 제공될 예정입니다.</span>
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={handleProfileSave}
              disabled={isProfileSaving}
              className="inline-flex h-11 items-center justify-center rounded-[14px] bg-slate-950 px-6 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-900/10"
            >
              {isProfileSaving ? "저장 중..." : "저장"}
            </button>
          </div>
        </section>
      );
    }

    if (currentSection === "security") {
      return (
        <section className={pageCardClassName}>
          <SectionHeader title="보안 설정" description="비밀번호 변경과 최근 로그인 기록을 확인합니다." />

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
            <div className={blockCardClassName}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-slate-950 text-white">
                  <Shield size={17} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-950">비밀번호 변경</p>
                  <p className="mt-1 text-xs font-medium text-slate-400">새 비밀번호를 입력해 계정 보안을 강화합니다.</p>
                </div>
              </div>
              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">새 비밀번호</span>
                  <input type="password" value={passwordForm.newPassword} onChange={handlePasswordChange("newPassword")} className={inputClassName} />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">새 비밀번호 확인</span>
                  <input type="password" value={passwordForm.confirmPassword} onChange={handlePasswordChange("confirmPassword")} className={inputClassName} />
                </label>
              </div>
              <button
                type="button"
                onClick={handlePasswordSave}
                disabled={isPasswordSaving}
                className="mt-5 inline-flex h-10 items-center justify-center rounded-[14px] bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-900/10"
              >
                {isPasswordSaving ? "변경 중..." : "비밀번호 변경"}
              </button>
            </div>

            <div className={blockCardClassName}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-cyan-50 text-cyan-700">
                  <History size={17} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-950">최근 로그인 기록</p>
                  <p className="mt-1 text-xs font-medium text-slate-400">최근 5개의 접속 기록을 확인할 수 있습니다.</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {loginHistory.length > 0 ? (
                  loginHistory.slice(0, 5).map((item) => (
                    <div key={item.historyId} className="rounded-[14px] border border-slate-100 bg-slate-50 px-4 py-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{item.deviceInfo || "알 수 없는 기기"}</p>
                          <p className="mt-1 text-xs font-medium text-slate-500">{item.ipAddress || "IP 정보 없음"}</p>
                        </div>
                        <p className="text-xs font-medium text-slate-400">{new Date(item.loginTime).toLocaleString("ko-KR")}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[14px] border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-medium text-slate-400">
                    로그인 기록이 없습니다.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      );
    }

    if (currentSection === "notifications") {
      const emailItems: ToggleItem[] = [
        {
          id: "email",
          title: "기본 이메일 알림",
          description: "거래 알림과 계정 상태 변화를 이메일로 받습니다.",
          enabled: emailEnabled,
          onToggle: () => handleNotificationToggle("EMAIL", emailEnabled),
        },
        {
          id: "ai-risk",
          title: "AI 위험 거래 알림",
          description: "이상 송금이나 위험 패턴이 감지되면 이메일로 안내합니다.",
          enabled: aiRiskEmailEnabled,
          onToggle: () => setAiRiskEmailEnabled((prev) => !prev),
        },
        {
          id: "ai-report",
          title: "AI 소비 분석 리포트",
          description: "AI가 작성한 주간/월간 소비 리포트를 이메일로 받아봅니다.",
          enabled: aiReportEmailEnabled,
          onToggle: () => setAiReportEmailEnabled((prev) => !prev),
        },
      ];

      const pushItems: ToggleItem[] = [
        {
          id: "push",
          title: "푸시 알림",
          description: "실시간 입출금과 보안 이벤트를 즉시 확인합니다.",
          enabled: pushEnabled,
          onToggle: () => handleNotificationToggle("PUSH", pushEnabled),
        },
      ];

      return (
        <section className={pageCardClassName}>
          <SectionHeader title="알림 설정" description="이메일과 푸시 알림, AI 기반 리포트 수신 여부를 설정합니다." />

          <div className="mt-5 grid gap-4">
            <div className={blockCardClassName}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-slate-100 text-slate-700">
                  <Mail size={17} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-950">이메일 설정</p>
                  <p className="mt-1 text-xs font-medium text-slate-400">중요 거래와 AI 분석 결과를 이메일로 받아봅니다.</p>
                </div>
              </div>
              <div className={`mt-4 divide-y divide-slate-100 ${notificationLoading ? "pointer-events-none opacity-60" : ""}`}>
                {emailItems.map((item) => (
                  <ToggleRow key={item.id} {...item} />
                ))}
              </div>
            </div>

            <div className={blockCardClassName}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-cyan-50 text-cyan-700">
                  <Bell size={17} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-950">실시간 알림</p>
                  <p className="mt-1 text-xs font-medium text-slate-400">즉시 확인이 필요한 이벤트를 푸시 알림으로 전달합니다.</p>
                </div>
              </div>
              <div className={`mt-4 divide-y divide-slate-100 ${notificationLoading ? "pointer-events-none opacity-60" : ""}`}>
                {pushItems.map((item) => (
                  <ToggleRow key={item.id} {...item} />
                ))}
              </div>
            </div>
          </div>
        </section>
      );
    }

    if (currentSection === "ai") {
      const aiItems: ToggleItem[] = [
        {
          id: "ai-analysis",
          title: "AI 소비 분석",
          description: "지출 패턴을 AI가 분석합니다.",
          enabled: aiAnalysisEnabled,
          onToggle: () => setAiAnalysisEnabled((prev) => !prev),
        },
        {
          id: "ai-transfer-risk",
          title: "송금 전 AI 위험도 분석",
          description: "송금 시 자동으로 위험도를 평가합니다.",
          enabled: aiTransferRiskEnabled,
          onToggle: () => setAiTransferRiskEnabled((prev) => !prev),
        },
        {
          id: "ai-category",
          title: "AI 카테고리 자동 분류",
          description: "거래 메모를 분석해 카테고리를 추천합니다.",
          enabled: aiCategoryEnabled,
          onToggle: () => setAiCategoryEnabled((prev) => !prev),
        },
        {
          id: "ai-report",
          title: "주간/월간 소비 리포트",
          description: "AI가 작성한 소비 리포트를 이메일로 받습니다.",
          enabled: aiWeeklyReportEnabled,
          onToggle: () => setAiWeeklyReportEnabled((prev) => !prev),
        },
      ];

      return (
        <section className={pageCardClassName}>
          <SectionHeader title="AI 설정" description="AI 분석과 자동화 기능의 동작 여부를 설정합니다." />

          <div className={`mt-5 ${blockCardClassName}`}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-cyan-50 text-cyan-700">
                <Bot size={17} />
              </div>
              <div>
                <p className="text-sm font-black text-slate-950">AI 기능</p>
                <p className="mt-1 text-xs font-medium text-slate-400">소비 분석, 위험도 평가, 카테고리 추천 기능을 관리합니다.</p>
              </div>
            </div>
            <div className="mt-4 divide-y divide-slate-100">
              {aiItems.map((item) => (
                <ToggleRow key={item.id} {...item} />
              ))}
            </div>
          </div>
        </section>
      );
    }

    if (currentSection === "transfer") {
      return (
        <section className={pageCardClassName}>
          <SectionHeader title="송금 설정" description="대표 계좌와 송금 한도를 한 화면에서 관리합니다." />

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <div className={blockCardClassName}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-slate-950">대표 계좌 설정</p>
                  <p className="mt-1 text-xs font-medium text-slate-400">송금 시 기본으로 선택되는 계좌입니다.</p>
                </div>
                <div className="rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-bold text-cyan-700">
                  {accounts.some((account) => account.isMain) ? "대표 지정됨" : "선택 필요"}
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {accounts.length > 0 ? (
                  accounts.map((account) => (
                    <button
                      key={account.accountId}
                      type="button"
                      onClick={() => handleSetMainAccount(account.accountId)}
                      className={`flex w-full items-center justify-between rounded-[14px] border px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-900/5 ${
                        account.isMain
                          ? "border-cyan-300 bg-cyan-50"
                          : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-black text-slate-950">{account.accountName}</p>
                        <p className="mt-1 text-sm font-medium text-slate-500">{formatAccountNumber(account.accountNumber)}</p>
                        <p className="mt-2 text-xs font-semibold text-slate-400">{account.balance.toLocaleString("ko-KR")} 원</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {account.isMain && <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-bold text-white">대표</span>}
                        <ChevronRight size={18} className="text-slate-400" />
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="rounded-[14px] border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm font-medium text-slate-400">
                    등록된 계좌가 없습니다.
                  </div>
                )}
              </div>
            </div>

            <div className={blockCardClassName}>
              <p className="text-sm font-black text-slate-950">송금 한도</p>
              <p className="mt-1 text-xs font-medium text-slate-400">1회 및 1일 송금 한도를 설정합니다.</p>
              <div className="mt-4 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">1회 송금 한도</span>
                  <input value={formatCurrencyInput(transferLimit?.perTransactionLimit ?? 0)} onChange={handleLimitInput("perTransactionLimit")} className={inputClassName} />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">1일 송금 한도</span>
                  <input value={formatCurrencyInput(transferLimit?.dailyLimit ?? 0)} onChange={handleLimitInput("dailyLimit")} className={inputClassName} />
                </label>
              </div>
              <button
                type="button"
                onClick={handleTransferSave}
                disabled={isTransferSaving || !transferLimit}
                className="mt-5 inline-flex h-11 items-center justify-center rounded-[14px] bg-slate-950 px-6 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-900/10"
              >
                {isTransferSaving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </section>
      );
    }

    if (currentSection === "privacy") {
      const deviceSessions = loginHistory.length > 0
        ? loginHistory.slice(0, 3).map((item, index) => ({
            id: item.historyId,
            device: item.deviceInfo || "알 수 없는 기기",
            ip: item.ipAddress || "IP 정보 없음",
            time: new Date(item.loginTime).toLocaleString("ko-KR", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            }),
            current: index === 0,
          }))
        : [
            {
              id: 1,
              device: "Chrome / macOS",
              ip: "121.168.xx.xx",
              time: "2026. 06. 28. 15:30",
              current: true,
            },
            {
              id: 2,
              device: "Safari / iPhone",
              ip: "175.202.xx.xx",
              time: "2026. 06. 20. 09:12",
              current: false,
            },
            {
              id: 3,
              device: "Chrome / Windows",
              ip: "59.5.xx.xx",
              time: "2026. 06. 18. 02:40",
              current: false,
            },
          ];

      return (
        <section className={pageCardClassName}>
          <SectionHeader title="개인정보 관리" description="로그인 기기와 세션 상태를 확인하고 접근을 제어합니다." />

          <div className="mt-5 space-y-4">
            <div className={blockCardClassName}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-slate-100 text-slate-700">
                  <ShieldAlert size={17} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-950">로그인 기록</p>
                  <p className="mt-1 text-xs font-medium text-slate-400">최근 로그인 기기와 접속 시간을 확인할 수 있습니다.</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {deviceSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between gap-4 rounded-[14px] border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-white text-sm font-black text-slate-700 shadow-sm">
                        {session.device.toLowerCase().includes("iphone") ? "📱" : "💻"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-black text-slate-950">{session.device}</p>
                          {session.current && (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                              현재
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs font-medium text-slate-400">
                          {session.ip} · {session.time}
                        </p>
                      </div>
                    </div>

                    {!session.current && (
                      <button
                        type="button"
                        onClick={() => toast("선택한 기기 로그아웃 기능은 준비 중입니다.")}
                        className="inline-flex h-8 items-center justify-center rounded-[10px] bg-rose-50 px-3 text-xs font-bold text-rose-500 transition hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-500/10"
                      >
                        로그아웃
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className={blockCardClassName}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-slate-950">다른 기기 전체 로그아웃</p>
                  <p className="mt-1 text-xs font-medium text-slate-400">현재 기기를 제외한 모든 기기에서 로그아웃합니다.</p>
                </div>
                <button
                  type="button"
                  onClick={() => toast("다른 기기 전체 로그아웃 기능은 준비 중입니다.")}
                  className="inline-flex h-10 items-center justify-center rounded-[12px] bg-rose-50 px-4 text-xs font-bold text-rose-500 transition hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-500/10"
                >
                  전체 로그아웃
                </button>
              </div>
            </div>
          </div>
        </section>
      );
    }

    if (currentSection === "account") {
      return (
        <section className={pageCardClassName}>
          <SectionHeader title="계정 관리" description="로그아웃과 계정 삭제 등 계정 관련 작업을 수행합니다." />

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className={blockCardClassName}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-slate-950 text-white">
                  <LogOut size={17} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-950">로그아웃</p>
                  <p className="mt-1 text-xs font-medium text-slate-400">현재 세션을 종료하고 로그인 화면으로 이동합니다.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-5 inline-flex h-10 items-center justify-center rounded-[14px] bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-900/10"
              >
                로그아웃
              </button>
            </div>

            <div className="rounded-[16px] border border-rose-100 bg-rose-50 px-5 py-4 shadow-[0_8px_24px_rgba(244,63,94,0.06)]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-rose-500 text-white">
                  <UserRound size={17} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-950">회원 탈퇴</p>
                  <p className="mt-1 text-xs font-medium text-slate-500">탈퇴 시 계정과 관련 데이터가 삭제되며 복구할 수 없습니다.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isAccountSaving}
                className="mt-5 inline-flex h-10 items-center justify-center rounded-[14px] bg-rose-500 px-4 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-500/20"
              >
                {isAccountSaving ? "처리 중..." : "회원 탈퇴"}
              </button>
            </div>
          </div>
        </section>
      );
    }

    return (
      <section className={pageCardClassName}>
        <SectionHeader title="AI 설정" description="AI 분석과 자동화 기능의 동작 여부를 설정합니다." />
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-[#eef4fb] text-slate-900">
      <div className="mx-auto grid max-w-[1440px] gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
        <UserSidebar unreadCount={unreadCount} />

        <main className="flex min-h-screen flex-col">
          <header className="border-b border-slate-200 bg-white px-5 py-3">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <h1 className="text-[22px] font-black tracking-tight text-slate-950">설정</h1>
                <p className="mt-1 text-xs font-semibold text-slate-400">EzPay · {todayLabel}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 text-sm font-semibold">
                  <button type="button" className="rounded-full bg-slate-950 px-5 py-2 text-white shadow-sm">
                    사용자 뷰
                  </button>
                  <button
                    type="button"
                    className="rounded-full px-5 py-2 text-slate-600 transition hover:text-slate-900"
                    onClick={() => navigateToAdminDashboard(navigate)}
                  >
                    관리자 뷰
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/notifications")}
                  className="relative flex h-10 w-10 items-center justify-center rounded-[14px] border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute right-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white shadow-lg shadow-rose-500/30">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </header>

          <div className="flex-1 bg-[#eef4fb] px-6 py-5">
            <div className="mx-auto grid w-full max-w-[980px] gap-4 xl:grid-cols-[164px_minmax(0,1fr)]">
              <aside className="rounded-[18px] bg-white px-3 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                <div className="mb-3 px-2">
                  <p className="text-xs font-black tracking-tight text-slate-400">설정</p>
                </div>

                <div className="-mx-2 flex gap-3 overflow-x-auto px-2 pb-2 xl:mx-0 xl:block xl:space-y-1.5 xl:overflow-visible xl:px-0">
                  {settingMenus.map(({ id, label, icon: Icon }) => {
                    const active = currentSection === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => handleSectionChange(id)}
                        className={`min-w-[180px] rounded-[10px] border px-3 py-2.5 text-left transition xl:w-full xl:min-w-0 ${
                          active
                            ? "border-slate-950 bg-slate-950 text-white shadow-[0_10px_24px_rgba(15,23,42,0.12)]"
                            : "border-transparent bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] ${
                              active ? "bg-white/10 text-white" : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            <Icon size={14} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black">{label}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </aside>

              <div className="pt-1">{renderContent()}</div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LayoutSettings;
