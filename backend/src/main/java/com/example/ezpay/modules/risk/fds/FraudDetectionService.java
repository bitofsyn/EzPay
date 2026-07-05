package com.example.ezpay.modules.risk.fds;

import com.example.ezpay.modules.risk.fds.dto.FraudCheckContext;
import com.example.ezpay.modules.risk.fds.dto.FraudCheckResult;

/**
 * 송금 실행(원장 기록) 직전에 동기적으로 호출되는 사전 위험도 분석(FDS) 진입점.
 */
public interface FraudDetectionService {

    /**
     * 송금 컨텍스트를 평가해 진행/검토/보류/차단 판정을 반환한다.
     * 구현체는 내부 장애/타임아웃에도 예외를 던지지 않고 fail-safe(HOLD) 판정을 반환해야 한다.
     */
    FraudCheckResult evaluate(FraudCheckContext ctx);
}
