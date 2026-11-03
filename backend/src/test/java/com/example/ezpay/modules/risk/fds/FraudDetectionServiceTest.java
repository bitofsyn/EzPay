package com.example.ezpay.modules.risk.fds;

import com.example.ezpay.modules.risk.fds.dto.FraudCheckContext;
import com.example.ezpay.modules.risk.fds.dto.FraudCheckResult;
import com.example.ezpay.modules.risk.fds.rule.FraudRule;
import com.example.ezpay.modules.risk.fds.rule.RuleSignal;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class FraudDetectionServiceTest {

    @Test
    void approvesWhenNoRuleDetectsRisk() {
        FraudDetectionServiceImpl service = service(List.of(rule("NORMAL", RuleSignal.none())));

        FraudCheckResult result = service.evaluate(context());

        assertThat(result.getDecision()).isEqualTo(FraudDecision.APPROVE);
        assertThat(result.getScore()).isZero();
    }

    @Test
    void requiresReviewWhenAccumulatedScoreReachesReviewThreshold() {
        FraudDetectionServiceImpl service = service(List.of(
                rule("AMOUNT", RuleSignal.score(20, "고액 거래")),
                rule("VELOCITY", RuleSignal.score(25, "반복 거래"))));

        FraudCheckResult result = service.evaluate(context());

        assertThat(result.getDecision()).isEqualTo(FraudDecision.REVIEW);
        assertThat(result.getScore()).isEqualTo(45);
        assertThat(result.getReason()).contains("고액 거래", "반복 거래");
    }

    @Test
    void blocksImmediatelyOnHardBlockSignal() {
        FraudDetectionServiceImpl service = service(List.of(
                rule("BLACKLIST", RuleSignal.block(100, "블랙리스트 계좌"))));

        FraudCheckResult result = service.evaluate(context());

        assertThat(result.getDecision()).isEqualTo(FraudDecision.BLOCK);
        assertThat(result.isBlocked()).isTrue();
    }

    @Test
    void holdsTransferWhenRuleEvaluationFails() {
        FraudRule failingRule = new FraudRule() {
            @Override public String name() { return "FAILED_RULE"; }
            @Override public RuleSignal evaluate(FraudCheckContext ctx) {
                throw new IllegalStateException("FDS unavailable");
            }
        };
        FraudDetectionServiceImpl service = service(List.of(failingRule));

        FraudCheckResult result = service.evaluate(context());

        assertThat(result.getDecision()).isEqualTo(FraudDecision.HOLD);
        assertThat(result.isHeld()).isTrue();
    }

    private FraudDetectionServiceImpl service(List<FraudRule> rules) {
        FraudDetectionServiceImpl service = new FraudDetectionServiceImpl(
                rules, new FraudCircuitBreaker(1, 60_000));
        ReflectionTestUtils.setField(service, "reviewScore", 40);
        ReflectionTestUtils.setField(service, "blockScore", 80);
        return service;
    }

    private FraudRule rule(String name, RuleSignal signal) {
        return new FraudRule() {
            @Override public String name() { return name; }
            @Override public RuleSignal evaluate(FraudCheckContext ctx) { return signal; }
        };
    }

    private FraudCheckContext context() {
        return FraudCheckContext.builder()
                .requestId("fds-test")
                .fromAccountId(1L)
                .toAccountId(2L)
                .fromAccountNumber("FROM")
                .toAccountNumber("TO")
                .amount(new BigDecimal("100000"))
                .build();
    }
}
