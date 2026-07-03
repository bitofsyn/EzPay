import { useEffect, useRef, useState } from "react";
import { getToken } from "../utils/storage";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

const BASE_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 15000;

export interface UseSseChannelOptions<T> {
  // JSON 이벤트 수신 콜백. connect 핑 등 JSON이 아닌 메시지는 자동으로 걸러진다.
  onEvent?: (data: T) => void;
  // false면 구독하지 않는다(예: 초기 로딩/에러 상태, 로그인 전).
  enabled?: boolean;
  // 수신 payload가 유효한 이벤트인지 검증. false 반환 시 무시한다.
  validate?: (data: unknown) => boolean;
}

export interface UseSseChannelReturn {
  // SSE 연결 상태(라이브 표시/폴백 UI 용)
  connected: boolean;
}

// 관리자 실시간 이벤트 스트림(/admin/stream/{channel})을 구독하는 범용 SSE 훅.
//
// - 브라우저 EventSource의 기본 재연결에 더해, 연결이 끊기면 지수 백오프로 명시적으로
//   재연결을 시도한다(서버 재시작·네트워크 단절 대비).
// - onEvent/validate 콜백은 ref로 유지되어, 콜백이 매 렌더 새로 만들어져도
//   불필요한 재구독(연결 재수립)이 발생하지 않는다.
// - SSE는 브라우저 제약으로 헤더를 실을 수 없어 토큰을 쿼리 파라미터(?token=)로 전달한다.
export function useSseChannel<T = unknown>(
  channel: string,
  { onEvent, enabled = true, validate }: UseSseChannelOptions<T> = {},
): UseSseChannelReturn {
  const [connected, setConnected] = useState(false);

  const onEventRef = useRef(onEvent);
  const validateRef = useRef(validate);
  onEventRef.current = onEvent;
  validateRef.current = validate;

  useEffect(() => {
    if (!enabled) return;
    const token = getToken();
    if (!token) return;

    let source: EventSource | null = null;
    let retryTimer: number | undefined;
    let retryAttempt = 0;
    let closed = false;

    const connect = () => {
      if (closed) return;

      source = new EventSource(
        `${apiBaseUrl}/admin/stream/${channel}?token=${encodeURIComponent(token)}`,
      );

      source.onopen = () => {
        retryAttempt = 0;
        setConnected(true);
      };

      source.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as T;
          if (validateRef.current && !validateRef.current(data)) return;
          onEventRef.current?.(data);
        } catch {
          // connect 핑("connected") 등 JSON이 아닌 메시지는 무시
        }
      };

      source.onerror = () => {
        setConnected(false);
        source?.close();
        if (closed) return;
        // 지수 백오프 재연결 (1s → 2s → 4s … 최대 15s)
        const delay = Math.min(BASE_RETRY_DELAY * 2 ** retryAttempt, MAX_RETRY_DELAY);
        retryAttempt += 1;
        retryTimer = window.setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      closed = true;
      if (retryTimer) window.clearTimeout(retryTimer);
      source?.close();
    };
  }, [channel, enabled]);

  return { connected };
}
