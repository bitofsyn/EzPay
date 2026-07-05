package com.example.ezpay.modules.risk.fds.rule;

import com.example.ezpay.modules.risk.fds.dto.FraudCheckContext;
import com.example.ezpay.repository.user.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.sql.Timestamp;
import java.time.Instant;

/**
 * 속도(Velocity) 룰: 단기간 내 과도한 송금 시도를 탐지한다.
 * 짧은 시간창 안에서 임계 건수 이상이면 계정 탈취/자동화 이체 정황으로 보아 즉시 차단한다.
 */
@Component
@RequiredArgsConstructor
public class VelocityRule implements FraudRule {

    private final TransactionRepository transactionRepository;

    @Value("${ezpay.fds.velocity.window-seconds:60}")
    private long windowSeconds;

    @Value("${ezpay.fds.velocity.max-count:5}")
    private int maxCount;

    @Override
    public String name() {
        return "VELOCITY";
    }

    @Override
    public RuleSignal evaluate(FraudCheckContext ctx) {
        Timestamp since = Timestamp.from(Instant.now().minusSeconds(windowSeconds));
        long recentCount = transactionRepository.countRecentTransfersBySender(ctx.getFromAccountId(), since);

        if (recentCount >= maxCount) {
            return RuleSignal.block(60, String.format(
                    "단기간 과도한 송금 시도 감지: 최근 %d초간 %d건.", windowSeconds, recentCount));
        }
        // 임계 근접(과반)이면 차단하지 않고 위험 점수만 가중한다.
        int warnAt = Math.max(1, maxCount - 2);
        if (recentCount >= warnAt) {
            return RuleSignal.score(25, String.format(
                    "짧은 시간 내 반복 송금 감지: 최근 %d초간 %d건.", windowSeconds, recentCount));
        }
        return RuleSignal.none();
    }
}
