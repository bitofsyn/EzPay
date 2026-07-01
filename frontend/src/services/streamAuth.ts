import { getToken } from '../utils/storage';

/**
 * SSE(EventSource)/WebSocket은 브라우저 제약으로 Authorization 헤더를 실을 수 없어
 * JWT를 쿼리 파라미터(?token=)로 전달한다. 백엔드 JwtAuthenticationFilter가 이를 인식한다.
 */
export const withAuthToken = (url: string): string => {
  const token = getToken();
  if (!token) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}token=${encodeURIComponent(token)}`;
};
