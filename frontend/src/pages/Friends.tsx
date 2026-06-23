import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  Pencil,
  Plus,
  Search,
  SendHorizontal,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { getDashboardInfo } from "../api/UserAPI";
import { Transaction } from "../types";
import { formatDateShort, parseDate } from "../utils/formatters";
import UserSidebar from "../components/UserSidebar";

interface Friend {
  id: string;
  nickname: string;
  realName: string;
  bank: string;
  accountNumber: string;
  isFavorite: boolean;
  addedAt: string;
  lastSentAt?: string;
}

const AVATAR_COLORS = [
  "bg-blue-600",
  "bg-slate-800",
  "bg-cyan-500",
  "bg-slate-700",
  "bg-indigo-500",
  "bg-teal-600",
  "bg-violet-600",
];

const BANK_OPTIONS = [
  "국민은행", "신한은행", "우리은행", "하나은행",
  "기업은행", "농협은행", "카카오뱅크", "토스뱅크",
];

const STORAGE_KEY = "ezpay_friends";

const loadFriends = (): Friend[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
};

const saveFriends = (friends: Friend[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(friends));
};

const maskAccount = (num: string) => {
  if (num.length <= 4) return num;
  return num.slice(0, 4) + "-****-" + num.slice(-4);
};

interface RecentSender {
  name: string;
  bank: string;
  lastDate: string;
  avatarColor: string;
}

const Friends: React.FC = () => {
  const navigate = useNavigate();
  const [friends, setFriends] = useState<Friend[]>(loadFriends);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [ownAccountIds, setOwnAccountIds] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");

  // 모달
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formNickname, setFormNickname] = useState("");
  const [formRealName, setFormRealName] = useState("");
  const [formBank, setFormBank] = useState(BANK_OPTIONS[0]);
  const [formAccount, setFormAccount] = useState("");
  const [formFavorite, setFormFavorite] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    getDashboardInfo()
      .then((res) => {
        const accs: { accountId: number }[] = res.data?.account || [];
        setOwnAccountIds(new Set(accs.map((a) => a.accountId)));
        setTransactions((res.data?.transactions || []) as Transaction[]);
      })
      .catch(() => {});
  }, []);

  // 최근 보낸 사람 (거래 내역 기반)
  const recentSenders = useMemo((): RecentSender[] => {
    const freq: Record<number, { name: string; bank: string; lastDate: string; count: number }> = {};
    transactions
      .filter((t) => ownAccountIds.has(t.senderAccount?.accountId))
      .forEach((t) => {
        const id = t.receiverAccount?.accountId;
        const name = t.receiverAccount?.bankName || "상대방";
        const bank = t.receiverAccount?.bankName || "";
        const date = t.transactionDate;
        if (id != null) {
          if (!freq[id]) freq[id] = { name, bank, lastDate: date, count: 0 };
          if (parseDate(date) > parseDate(freq[id].lastDate)) freq[id].lastDate = date;
          freq[id].count++;
        }
      });
    return Object.entries(freq)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([, { name, bank, lastDate }], i) => ({
        name,
        bank,
        lastDate: formatDateShort(lastDate),
        avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
      }));
  }, [transactions, ownAccountIds]);

  const filteredFriends = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter(
      (f) =>
        f.nickname.toLowerCase().includes(q) ||
        f.realName.toLowerCase().includes(q) ||
        f.bank.toLowerCase().includes(q) ||
        f.accountNumber.includes(q)
    );
  }, [friends, search]);

  const favorites = filteredFriends.filter((f) => f.isFavorite);
  const others = filteredFriends.filter((f) => !f.isFavorite);

  const openAdd = () => {
    setEditingId(null);
    setFormNickname("");
    setFormRealName("");
    setFormBank(BANK_OPTIONS[0]);
    setFormAccount("");
    setFormFavorite(false);
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (f: Friend) => {
    setEditingId(f.id);
    setFormNickname(f.nickname);
    setFormRealName(f.realName);
    setFormBank(f.bank);
    setFormAccount(f.accountNumber);
    setFormFavorite(f.isFavorite);
    setFormError("");
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formRealName.trim() && !formNickname.trim()) { setFormError("이름 또는 별칭을 입력해주세요."); return; }
    if (!formAccount.trim()) { setFormError("계좌번호를 입력해주세요."); return; }

    // 표시 이름: 별칭 우선, 없으면 실명
    const displayNickname = formNickname.trim() || formRealName.trim();

    let updated: Friend[];
    if (editingId) {
      updated = friends.map((f) =>
        f.id === editingId
          ? { ...f, nickname: displayNickname, realName: formRealName, bank: formBank, accountNumber: formAccount, isFavorite: formFavorite }
          : f
      );
    } else {
      const newFriend: Friend = {
        id: Date.now().toString(),
        nickname: displayNickname,
        realName: formRealName,
        bank: formBank,
        accountNumber: formAccount,
        isFavorite: formFavorite,
        addedAt: new Date().toISOString(),
      };
      updated = [...friends, newFriend];
    }
    saveFriends(updated);
    setFriends(updated);
    setShowModal(false);
  };

  const toggleFavorite = (id: string) => {
    const updated = friends.map((f) =>
      f.id === id ? { ...f, isFavorite: !f.isFavorite } : f
    );
    saveFriends(updated);
    setFriends(updated);
  };

  const deleteFriend = (id: string) => {
    const updated = friends.filter((f) => f.id !== id);
    saveFriends(updated);
    setFriends(updated);
  };

  const handleSend = (f: Friend) => {
    navigate("/send");
  };

  const FriendRow = ({ f }: { f: Friend }) => (
    <div className="flex items-center gap-4 rounded-[18px] px-4 py-3.5 transition hover:bg-slate-50">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black text-white ${AVATAR_COLORS[f.nickname.charCodeAt(0) % AVATAR_COLORS.length]}`}>
        {f.nickname.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-black text-slate-950 truncate">{f.nickname}</p>
          {f.realName && (
            <span className="text-xs font-semibold text-slate-400">({f.realName})</span>
          )}
          {f.isFavorite && <Star size={12} className="text-amber-400 fill-amber-400 shrink-0" />}
        </div>
        <p className="text-xs font-semibold text-slate-400 truncate">
          {f.bank} · {maskAccount(f.accountNumber)}
        </p>
        {f.lastSentAt && (
          <p className="text-[11px] font-medium text-slate-300">최근 {formatDateShort(f.lastSentAt)}</p>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => handleSend(f)}
          className="flex items-center gap-1 rounded-[10px] bg-slate-950 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-700"
        >
          <SendHorizontal size={11} />
          송금
        </button>
        <button
          type="button"
          onClick={() => toggleFavorite(f.id)}
          className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-slate-100 bg-white transition hover:bg-amber-50"
        >
          <Star size={14} className={f.isFavorite ? "text-amber-400 fill-amber-400" : "text-slate-300"} />
        </button>
        <button
          type="button"
          onClick={() => openEdit(f)}
          className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-slate-100 bg-white text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
        >
          <Pencil size={13} />
        </button>
        <button
          type="button"
          onClick={() => deleteFriend(f.id)}
          className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-slate-100 bg-white text-slate-300 transition hover:bg-rose-50 hover:text-rose-500"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#eef3fb] p-3 text-slate-900 lg:p-4">
      <div className="mx-auto grid max-w-[1440px] gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
        <UserSidebar />

        <main className="flex flex-col gap-5">
          {/* Header */}
          <header className="rounded-[28px] border border-white/70 bg-white/90 px-5 py-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                >
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <h1 className="text-[2rem] font-black tracking-tight text-slate-950">친구 관리</h1>
                  <p className="text-sm font-semibold text-slate-400">총 {friends.length}명 등록됨</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={openAdd}
                  className="flex items-center gap-2 rounded-[14px] bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  <Plus size={15} />
                  친구 추가
                </button>
                <button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300"
                  onClick={() => navigate("/settings/notification")}
                >
                  <Bell size={18} />
                </button>
              </div>
            </div>
          </header>

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="이름, 별칭, 은행으로 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-[18px] border border-white/80 bg-white py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-900 placeholder-slate-400 shadow-[0_8px_30px_rgba(15,23,42,0.06)] focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-100"
            />
          </div>

          {/* 최근 보낸 사람 */}
          {recentSenders.length > 0 && (
            <div className="rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
              <p className="mb-4 text-sm font-black text-slate-950">최근 보낸 사람</p>
              <div className="flex gap-4 overflow-x-auto pb-1">
                {recentSenders.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => navigate("/send")}
                    className="flex flex-col items-center gap-2 min-w-[72px] rounded-[18px] border border-slate-100 bg-slate-50 px-3 py-4 transition hover:border-slate-200 hover:bg-slate-100"
                  >
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full text-base font-black text-white ${s.avatarColor}`}>
                      {s.name.charAt(0)}
                    </div>
                    <p className="text-xs font-black text-slate-800 truncate max-w-[60px]">{s.name}</p>
                    <p className="text-[10px] font-semibold text-slate-400 truncate max-w-[60px]">{s.bank}</p>
                    <p className="text-[10px] font-medium text-slate-300">{s.lastDate}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 즐겨찾기 */}
          {favorites.length > 0 && (
            <div className="rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
              <div className="flex items-center gap-2 mb-3">
                <Star size={15} className="text-amber-400 fill-amber-400" />
                <p className="text-sm font-black text-slate-950">즐겨찾기</p>
              </div>
              <div className="divide-y divide-slate-50">
                {favorites.map((f) => <FriendRow key={f.id} f={f} />)}
              </div>
            </div>
          )}

          {/* 전체 친구 */}
          <div className="rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
            <p className="mb-3 text-sm font-black text-slate-950">
              전체 친구{" "}
              <span className="font-semibold text-slate-400">({others.length}명)</span>
            </p>

            {others.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {others.map((f) => <FriendRow key={f.id} f={f} />)}
              </div>
            ) : (
              <div className="flex flex-col items-center py-14 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                  <Plus size={24} className="text-slate-400" />
                </div>
                <p className="text-sm font-bold text-slate-500">등록된 친구가 없습니다</p>
                <p className="mt-1 mb-5 text-sm font-medium text-slate-400">친구를 추가하면 빠르게 송금할 수 있어요.</p>
                <button
                  type="button"
                  onClick={openAdd}
                  className="flex items-center gap-2 rounded-[14px] bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  <Plus size={15} />
                  첫 친구 추가하기
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 친구 추가/수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <h3 className="text-[1.15rem] font-black text-slate-950">
                {editingId ? "친구 정보 수정" : "친구 추가"}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 px-6 py-5">
              {/* 이름 (실명) */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">이름</label>
                <input
                  type="text"
                  placeholder="홍길동"
                  value={formRealName}
                  onChange={(e) => setFormRealName(e.target.value)}
                  className="w-full rounded-[10px] border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-200"
                />
              </div>

              {/* 별칭 (선택) */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">별칭(선택)</label>
                <input
                  type="text"
                  placeholder="예: 민수 형"
                  value={formNickname}
                  onChange={(e) => setFormNickname(e.target.value)}
                  className="w-full rounded-[10px] border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-200"
                />
              </div>

              {/* 계좌번호 */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">계좌번호</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="숫자만 입력"
                  value={formAccount}
                  onChange={(e) => setFormAccount(e.target.value.replace(/\D/g, ""))}
                  className="w-full rounded-[10px] border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-200"
                />
              </div>

              {/* 은행 */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">은행</label>
                <select
                  value={formBank}
                  onChange={(e) => setFormBank(e.target.value)}
                  className="w-full appearance-none rounded-[10px] border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-200"
                >
                  {BANK_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              {/* 즐겨찾기 */}
              <label className="flex cursor-pointer items-center gap-2 pt-1">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={formFavorite}
                    onChange={(e) => setFormFavorite(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`flex h-4 w-4 items-center justify-center rounded border transition ${formFavorite ? "border-slate-950 bg-slate-950" : "border-slate-300 bg-white"}`}>
                    {formFavorite && (
                      <svg width="8" height="7" viewBox="0 0 8 7" fill="none">
                        <path d="M1 3.5L3 5.5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="flex items-center gap-1 text-sm font-semibold text-slate-700">
                  <Star size={13} className="text-amber-400 fill-amber-400" />
                  즐겨찾기
                </span>
              </label>

              {formError && (
                <p className="rounded-[10px] border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-600">
                  {formError}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-[16px] border border-slate-200 bg-white py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="rounded-[16px] bg-slate-950 py-3.5 text-sm font-bold text-white hover:bg-slate-800"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Friends;
