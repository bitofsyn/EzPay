package com.example.ezpay.modules.risk.fds.rule;

import com.example.ezpay.modules.risk.fds.dto.FraudCheckContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * 수취 계좌가 블랙리스트에 등록되어 있으면 단독으로 즉시 차단한다.
 */
@Component
@RequiredArgsConstructor
public class BlacklistRule implements FraudRule {

    private final AccountBlacklist accountBlacklist;

    @Override
    public String name() {
        return "BLACKLIST";
    }

    @Override
    public RuleSignal evaluate(FraudCheckContext ctx) {
        if (accountBlacklist.isBlacklisted(ctx.getToAccountNumber())) {
            return RuleSignal.block(100,
                    "블랙리스트로 등록된 계좌로의 송금이 감지되었습니다.");
        }
        return RuleSignal.none();
    }
}
