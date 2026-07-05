package com.example.ezpay.modules.risk.fds.rule;

import com.example.ezpay.modules.risk.fds.dto.FraudCheckContext;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * 고액 송금 위험 점수 가중 룰.
 * 고액 자체로 즉시 차단하지는 않고(정상 고액 거래 존재) 위험 점수를 누적시킨다.
 */
@Component
public class HighAmountRule implements FraudRule {

    private final BigDecimal cautionThreshold;
    private final BigDecimal dangerThreshold;

    public HighAmountRule(
            @Value("${ezpay.fds.high-amount.caution-threshold:1000000}") BigDecimal cautionThreshold,
            @Value("${ezpay.fds.high-amount.danger-threshold:3000000}") BigDecimal dangerThreshold) {
        this.cautionThreshold = cautionThreshold;
        this.dangerThreshold = dangerThreshold;
    }

    @Override
    public String name() {
        return "HIGH_AMOUNT";
    }

    @Override
    public RuleSignal evaluate(FraudCheckContext ctx) {
        BigDecimal amount = ctx.getAmount();
        if (amount == null) {
            return RuleSignal.none();
        }
        if (amount.compareTo(dangerThreshold) >= 0) {
            return RuleSignal.score(50,
                    String.format("고액 송금 감지: ₩%,d. 이상 거래 패턴으로 의심됩니다.", amount.longValue()));
        }
        if (amount.compareTo(cautionThreshold) >= 0) {
            return RuleSignal.score(20,
                    String.format("평소보다 큰 금액(₩%,d)의 송금입니다.", amount.longValue()));
        }
        return RuleSignal.none();
    }
}
