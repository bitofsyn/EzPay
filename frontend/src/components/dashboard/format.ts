/** ₩1,284,000 형태 (원본 목업의 `won` 헬퍼와 동일) */
export const won = (n: number): string => "₩" + Number(n || 0).toLocaleString("ko-KR");

/** 1,284,000원 형태 */
export const wonK = (n: number): string => Number(n || 0).toLocaleString("ko-KR") + "원";

/** 이름 → 아바타 배경색 (해시 기반, 원본 avatarColor와 동일 팔레트) */
const AVATAR_COLORS = ["#0891b2", "#0f172a", "#1e3a8a", "#0c4a6e", "#334155", "#0e7490"];
export const avatarColor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};
