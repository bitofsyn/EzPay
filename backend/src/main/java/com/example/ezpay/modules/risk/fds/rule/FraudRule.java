package com.example.ezpay.modules.risk.fds.rule;

import com.example.ezpay.modules.risk.fds.dto.FraudCheckContext;

/**
 * 단일 이상거래 탐지 룰. 스프링 빈으로 등록된 모든 구현체가
 * {@code FraudDetectionServiceImpl}에 {@code List<FraudRule>}로 주입되어 순차 평가된다.
 * <p>새로운 지표(예: 외부 FDS 스코어링, 디바이스 핑거프린트)를 추가하려면
 * 이 인터페이스를 구현한 {@code @Component}만 추가하면 되며, 오케스트레이션 코드는 수정 불필요.
 */
public interface FraudRule {

    /** 로깅/사유 식별용 룰 이름 */
    String name();

    /** 컨텍스트를 평가해 위험 신호를 반환한다. 정상이면 {@link RuleSignal#none()}. */
    RuleSignal evaluate(FraudCheckContext ctx);
}
