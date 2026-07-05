package com.example.ezpay.modules.risk.fds.dto;

import com.example.ezpay.modules.risk.entity.RiskLevel;
import com.example.ezpay.modules.risk.fds.FraudDecision;
import lombok.Getter;

/**
 * FDS 종합 판정 결과(불변). 누적 위험 점수와 판정, 관리자 검토 큐 적재용 위험 등급/사유를 담는다.
 */
@Getter
public class FraudCheckResult {
    private final FraudDecision decision;
    private final RiskLevel level;
    private final int score;
    private final String reason;

    private FraudCheckResult(FraudDecision decision, RiskLevel level, int score, String reason) {
        this.decision = decision;
        this.level = level;
        this.score = score;
        this.reason = reason;
    }

    public static FraudCheckResult approve(int score) {
        return new FraudCheckResult(FraudDecision.APPROVE, RiskLevel.SAFE, score, "정상 거래");
    }

    public static FraudCheckResult review(int score, String reason) {
        return new FraudCheckResult(FraudDecision.REVIEW, RiskLevel.CAUTION, score, reason);
    }

    public static FraudCheckResult block(int score, String reason) {
        return new FraudCheckResult(FraudDecision.BLOCK, RiskLevel.DANGER, score, reason);
    }

    public static FraudCheckResult hold(String reason) {
        return new FraudCheckResult(FraudDecision.HOLD, RiskLevel.DANGER, 0, reason);
    }

    public boolean isBlocked() {
        return decision == FraudDecision.BLOCK;
    }

    public boolean isHeld() {
        return decision == FraudDecision.HOLD;
    }

    public boolean requiresReview() {
        return decision == FraudDecision.REVIEW;
    }
}
