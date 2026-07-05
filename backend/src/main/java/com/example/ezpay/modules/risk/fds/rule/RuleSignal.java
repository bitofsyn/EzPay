package com.example.ezpay.modules.risk.fds.rule;

import lombok.Getter;

/**
 * 개별 {@code FraudRule} 평가 신호.
 * <ul>
 *   <li>{@code score}   : 누적될 위험 점수 가중치</li>
 *   <li>{@code hardBlock}: 단독으로 즉시 차단해야 하는 결정적 신호(예: 블랙리스트)</li>
 *   <li>{@code reason}  : 탐지 사유. {@code null}이면 무신호(정상)</li>
 * </ul>
 */
@Getter
public class RuleSignal {
    private final int score;
    private final boolean hardBlock;
    private final String reason;

    private RuleSignal(int score, boolean hardBlock, String reason) {
        this.score = score;
        this.hardBlock = hardBlock;
        this.reason = reason;
    }

    /** 무신호(정상) */
    public static RuleSignal none() {
        return new RuleSignal(0, false, null);
    }

    /** 위험 점수 가중 */
    public static RuleSignal score(int score, String reason) {
        return new RuleSignal(score, false, reason);
    }

    /** 단독 즉시 차단 신호 */
    public static RuleSignal block(int score, String reason) {
        return new RuleSignal(score, true, reason);
    }

    public boolean isHit() {
        return reason != null;
    }
}
