package com.example.ezpay.modules.risk.fds;

import com.example.ezpay.modules.risk.fds.dto.FraudCheckContext;
import com.example.ezpay.modules.risk.fds.dto.FraudCheckResult;
import com.example.ezpay.modules.risk.fds.rule.FraudRule;
import com.example.ezpay.modules.risk.fds.rule.RuleSignal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * 룰 기반 사전 위험도 분석 오케스트레이터.
 * <p>등록된 모든 {@link FraudRule}을 순차 평가하여 위험 점수를 누적하고,
 * 결정적(hardBlock) 신호 또는 임계 점수 초과 시 차단/검토로 판정한다.
 * 전체 평가는 {@link FraudCircuitBreaker}로 감싸 장애를 격리하며,
 * 장애 시에는 금융 안전 원칙에 따라 fail-safe(HOLD, 송금 일시 보류)로 처리한다.
 */
@Slf4j
@Service
public class FraudDetectionServiceImpl implements FraudDetectionService {

    private final List<FraudRule> rules;
    private final FraudCircuitBreaker circuitBreaker;

    @Value("${ezpay.fds.block-score:80}")
    private int blockScore;

    @Value("${ezpay.fds.review-score:40}")
    private int reviewScore;

    public FraudDetectionServiceImpl(List<FraudRule> rules, FraudCircuitBreaker circuitBreaker) {
        this.rules = rules;
        this.circuitBreaker = circuitBreaker;
    }

    @Override
    public FraudCheckResult evaluate(FraudCheckContext ctx) {
        return circuitBreaker.execute(
                () -> runRules(ctx),
                () -> fallback(ctx)
        );
    }

    /** 모든 룰을 평가해 점수를 누적하고 최종 판정을 도출한다. */
    private FraudCheckResult runRules(FraudCheckContext ctx) {
        int totalScore = 0;
        List<String> reasons = new ArrayList<>();

        for (FraudRule rule : rules) {
            RuleSignal signal = rule.evaluate(ctx);
            if (!signal.isHit()) {
                continue;
            }
            totalScore += signal.getScore();
            reasons.add(signal.getReason());

            // 결정적 신호(블랙리스트 등)는 즉시 차단
            if (signal.isHardBlock()) {
                log.warn("FDS 즉시 차단 [{}] req={} reason={}", rule.name(), ctx.getRequestId(), signal.getReason());
                return FraudCheckResult.block(totalScore, joinReasons(reasons));
            }
        }

        if (totalScore >= blockScore) {
            return FraudCheckResult.block(totalScore, joinReasons(reasons));
        }
        if (totalScore >= reviewScore) {
            return FraudCheckResult.review(totalScore, joinReasons(reasons));
        }
        return FraudCheckResult.approve(totalScore);
    }

    /**
     * FDS 장애/서킷 오픈 시 fallback.
     * 사기를 통과시키는 fail-open 대신 송금을 일시 보류(fail-safe)하여 자금 유출을 방지한다.
     */
    private FraudCheckResult fallback(FraudCheckContext ctx) {
        log.warn("FDS 평가 불가 - 송금 일시 보류(fail-safe) req={}", ctx.getRequestId());
        return FraudCheckResult.hold(
                "위험도 분석 서비스를 일시적으로 사용할 수 없어 송금을 보류합니다. 잠시 후 다시 시도해 주세요.");
    }

    private String joinReasons(List<String> reasons) {
        return String.join(" ", reasons);
    }
}
