/**
 * 소셜 로그인(OAuth) 프론트 헬퍼.
 * - 카카오/네이버 인가(authorize) URL을 만들어 브라우저를 리다이렉트한다.
 * - CSRF 방지용 state를 생성/보관/검증한다.
 *
 * 백엔드 콜백 처리(코드 교환·토큰 발급)는 /users/oauth/{provider}/login 이 담당하며,
 * 프론트는 인가 코드를 받아 그대로 전달하기만 한다.
 */

export type OAuthProvider = "kakao" | "naver";

const STATE_STORAGE_KEY = "oauth_state";

const PROVIDER_AUTHORIZE_URL: Record<OAuthProvider, string> = {
  kakao: "https://kauth.kakao.com/oauth/authorize",
  naver: "https://nid.naver.com/oauth2.0/authorize",
};

const CLIENT_ID: Record<OAuthProvider, string | undefined> = {
  kakao: import.meta.env.VITE_KAKAO_CLIENT_ID,
  naver: import.meta.env.VITE_NAVER_CLIENT_ID,
};

/**
 * 콜백으로 돌아올 redirect-uri.
 * 개발/운영 환경 분리를 위해 VITE_OAUTH_REDIRECT_BASE_URL 로 오버라이드할 수 있고,
 * 없으면 현재 접속 origin 기준으로 자동 구성한다. (제공자 콘솔에 등록한 값과 반드시 일치해야 함)
 */
export const getRedirectUri = (provider: OAuthProvider): string => {
  const base =
    import.meta.env.VITE_OAUTH_REDIRECT_BASE_URL || window.location.origin;
  return `${base.replace(/\/$/, "")}/oauth/callback/${provider}`;
};

// 암호학적으로 안전한 랜덤 state 생성
const generateState = (): string => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
};

export const saveState = (state: string): void => {
  sessionStorage.setItem(STATE_STORAGE_KEY, state);
};

export const consumeState = (): string | null => {
  const state = sessionStorage.getItem(STATE_STORAGE_KEY);
  sessionStorage.removeItem(STATE_STORAGE_KEY);
  return state;
};

export const isProviderConfigured = (provider: OAuthProvider): boolean =>
  Boolean(CLIENT_ID[provider]);

/**
 * 제공자 인가 페이지로 브라우저를 이동시킨다. client-id 미설정 시 false 반환.
 */
export const redirectToProvider = (provider: OAuthProvider): boolean => {
  const clientId = CLIENT_ID[provider];
  if (!clientId) {
    return false;
  }

  const state = generateState();
  saveState(state);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: getRedirectUri(provider),
    state,
  });

  window.location.href = `${PROVIDER_AUTHORIZE_URL[provider]}?${params.toString()}`;
  return true;
};
