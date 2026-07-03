import DashboardCard from "./DashboardCard";
import type { FriendChip } from "./types";
import { avatarColor } from "./format";

interface FrequentFriendsCardProps {
  friends: FriendChip[];
  onSelectFriend?: (friend: FriendChip) => void;
  onViewAll?: () => void;
}

/**
 * 자주 보내는 친구 카드.
 * 즐겨찾기를 앞으로 정렬해 최대 5명, 가로 스크롤 아바타 칩으로 노출한다.
 */
const FrequentFriendsCard = ({ friends, onSelectFriend, onViewAll }: FrequentFriendsCardProps) => {
  const ordered = [...friends.filter((f) => f.favorite), ...friends.filter((f) => !f.favorite)].slice(0, 5);

  return (
    <DashboardCard
      title="자주 보내는 친구"
      action={
        <button
          type="button"
          onClick={onViewAll}
          className="text-sm font-bold text-cyan-600 transition hover:text-cyan-700"
        >
          전체보기
        </button>
      }
    >
      <div className="flex gap-3 overflow-x-auto pb-1">
        {ordered.length === 0 ? (
          <p className="w-full py-3 text-center text-sm text-slate-400">거래 내역이 없습니다</p>
        ) : (
          ordered.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onSelectFriend?.(f)}
              className="flex min-w-[68px] shrink-0 flex-col items-center gap-1.5 rounded-xl p-2 transition hover:bg-slate-50"
            >
              <div
                className="relative flex h-11 w-11 items-center justify-center rounded-full text-base font-extrabold text-white"
                style={{ background: avatarColor(f.name) }}
              >
                {f.name.charAt(0)}
                {f.favorite && (
                  <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-px text-[10px] leading-none">
                    ⭐
                  </span>
                )}
              </div>
              <p className="max-w-[64px] truncate text-xs font-semibold text-slate-600">{f.alias || f.name}</p>
            </button>
          ))
        )}
      </div>
    </DashboardCard>
  );
};

export default FrequentFriendsCard;
