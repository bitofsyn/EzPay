import type { RealtimeTransaction } from '../types';

export interface WebSocketSubscription {
  unsubscribe: () => void;
  isConnected: boolean;
}

/**
 * WebSocket 클라이언트 인스턴스 관리
 * 실제 구현 시: STOMP 클라이언트 또는 native WebSocket 사용
 */
class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 3000;

  constructor(url: string) {
    this.url = url;
  }

  connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('[WebSocket] Connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onclose = () => {
        console.log('[WebSocket] Disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
      };
    } catch (error) {
      console.error('[WebSocket] Connection failed:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
      setTimeout(() => this.connect(), delay);
    }
  }

  subscribe(
    topic: string,
    callback: (data: any) => void
  ): (() => void) => {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.connect();
      // 재귀 호출로 연결 완료 후 구독
      setTimeout(() => this.subscribe(topic, callback), 500);
      return () => {};
    }

    const messageHandler = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        if (message.topic === topic) {
          callback(message.data);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.addEventListener('message', messageHandler);

    return () => {
      this.ws?.removeEventListener('message', messageHandler);
    };
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

let wsManager: WebSocketManager | null = null;

/**
 * WebSocket 매니저 인스턴스 얻기
 */
const getWebSocketManager = (): WebSocketManager => {
  if (!wsManager) {
    const wsUrl = `${process.env.REACT_APP_WS_URL || 'ws://localhost:8080'}/ws/admin-events`;
    wsManager = new WebSocketManager(wsUrl);
  }
  return wsManager;
};

/**
 * 실시간 거래 스트림 구독
 * @param callback - 새로운 거래 수신 시 호출할 콜백
 * @returns 구독 해제 함수 및 연결 상태
 */
export const subscribeTransactionStream = (
  callback: (transaction: RealtimeTransaction) => void
): WebSocketSubscription => {
  const manager = getWebSocketManager();
  manager.connect();

  const unsubscribe = manager.subscribe('admin:dashboard:transactions', callback);

  return {
    unsubscribe,
    isConnected: manager.isConnected(),
  };
};

/**
 * 실시간 위험 거래 스트림 구독
 * @param callback - 새로운 위험 거래 수신 시 호출할 콜백
 * @returns 구독 해제 함수 및 연결 상태
 */
export const subscribeRiskTransactionStream = (
  callback: (transaction: any) => void
): WebSocketSubscription => {
  const manager = getWebSocketManager();
  manager.connect();

  const unsubscribe = manager.subscribe('admin:dashboard:risk-transactions', callback);

  return {
    unsubscribe,
    isConnected: manager.isConnected(),
  };
};

/**
 * WebSocket 연결 해제
 */
export const disconnectWebSocket = (): void => {
  if (wsManager) {
    wsManager.disconnect();
    wsManager = null;
  }
};

/**
 * WebSocket 연결 상태 확인
 */
export const isWebSocketConnected = (): boolean => {
  if (!wsManager) return false;
  return wsManager.isConnected();
};
