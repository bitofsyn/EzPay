package com.example.ezpay.modules.risk.fds;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.function.Supplier;

/**
 * 의존성 추가 없이 동작하는 경량 서킷 브레이커(CLOSED / OPEN / HALF_OPEN).
 * <p>FDS 평가(룰 실행, 향후 외부 스코어링 호출 포함)를 감싸 연속 실패가 임계치를 넘으면
 * 회로를 열어 더 이상 실행하지 않고 즉시 fallback으로 넘긴다. {@code openMillis} 경과 후
 * HALF_OPEN 상태로 1회 시험 호출을 허용하여 자동 복구한다.
 *
 * <p>계좌 락을 잡은 짧은 송금 트랜잭션 안에서 호출되므로, 장애가 전체 파이프라인으로
 * 번지지 않도록 격벽(bulkhead) 역할을 한다.
 */
@Slf4j
@Component
public class FraudCircuitBreaker {

    enum State { CLOSED, OPEN, HALF_OPEN }

    private final int failureThreshold;
    private final long openMillis;

    private volatile State state = State.CLOSED;
    private volatile int consecutiveFailures = 0;
    private volatile long openedAtMillis = 0L;

    public FraudCircuitBreaker(
            @Value("${ezpay.fds.circuit-breaker.failure-threshold:5}") int failureThreshold,
            @Value("${ezpay.fds.circuit-breaker.open-millis:30000}") long openMillis) {
        this.failureThreshold = failureThreshold;
        this.openMillis = openMillis;
    }

    /**
     * {@code action}을 서킷 보호 하에 실행한다. 회로가 열려 있거나 실행이 실패하면 {@code fallback}을 반환한다.
     */
    public <T> T execute(Supplier<T> action, Supplier<T> fallback) {
        if (!allowRequest()) {
            log.warn("FDS 서킷 브레이커 OPEN 상태 - 평가를 건너뛰고 fallback 적용");
            return fallback.get();
        }
        try {
            T result = action.get();
            onSuccess();
            return result;
        } catch (Exception e) {
            onFailure();
            log.warn("FDS 평가 실패({}회 연속) - fallback 적용: {}", consecutiveFailures, e.getMessage());
            return fallback.get();
        }
    }

    private synchronized boolean allowRequest() {
        if (state == State.OPEN) {
            if (System.currentTimeMillis() - openedAtMillis >= openMillis) {
                // 냉각시간 경과 → 시험 호출 1회 허용
                state = State.HALF_OPEN;
                return true;
            }
            return false;
        }
        return true; // CLOSED 또는 HALF_OPEN
    }

    private synchronized void onSuccess() {
        consecutiveFailures = 0;
        if (state != State.CLOSED) {
            log.info("FDS 서킷 브레이커 복구 → CLOSED");
        }
        state = State.CLOSED;
    }

    private synchronized void onFailure() {
        consecutiveFailures++;
        if (state == State.HALF_OPEN || consecutiveFailures >= failureThreshold) {
            state = State.OPEN;
            openedAtMillis = System.currentTimeMillis();
            log.error("FDS 서킷 브레이커 OPEN (연속 실패 {}회, {}ms 동안 차단)", consecutiveFailures, openMillis);
        }
    }
}
