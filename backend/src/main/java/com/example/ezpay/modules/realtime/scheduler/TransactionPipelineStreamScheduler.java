package com.example.ezpay.modules.realtime.scheduler;

import com.example.ezpay.modules.realtime.EventBroadcaster;
import com.example.ezpay.modules.realtime.dto.PipelineStage;
import com.example.ezpay.modules.realtime.dto.PipelineStageStatus;
import com.example.ezpay.modules.realtime.dto.TransactionPipelineEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ThreadLocalRandom;

// 실시간 트랜잭션 파이프라인 데모 스트림.
// 실제 Kafka 거래 트래픽이 없을 때도 관리자 대시보드의 파이프라인 컴포넌트가
// 살아있는 단계 전이를 보여줄 수 있도록, 가상 거래를 4단계에 걸쳐 순차 진행시키며
// SSE 채널("transaction-pipeline")로 단계 전이 이벤트를 브로드캐스트한다.
//
// ezpay.pipeline.demo.enabled=false 로 비활성화할 수 있다(운영에서 실제 Kafka만 사용 시).
@Slf4j
@Component
@ConditionalOnProperty(name = "ezpay.pipeline.demo.enabled", havingValue = "true", matchIfMissing = true)
public class TransactionPipelineStreamScheduler {

    private static final String SSE_CHANNEL = "transaction-pipeline";
    private static final PipelineStage[] STAGES = PipelineStage.values();

    private final EventBroadcaster eventBroadcaster;
    private final boolean demoEnabled;

    // 현재 진행 중인 가상 거래 상태
    private PipelineTx current;

    public TransactionPipelineStreamScheduler(
            EventBroadcaster eventBroadcaster,
            @Value("${ezpay.pipeline.demo.enabled:true}") boolean demoEnabled
    ) {
        this.eventBroadcaster = eventBroadcaster;
        this.demoEnabled = demoEnabled;
    }

    @Scheduled(fixedRate = 1400)
    public void tick() {
        if (!demoEnabled) {
            return;
        }
        try {
            broadcastNext();
        } catch (Exception e) {
            log.error("파이프라인 데모 브로드캐스트 실패: {}", e.getMessage());
        }
    }

    private void broadcastNext() {
        // 진행 중인 거래가 없거나 이전 거래가 종료됐으면 새 거래 접수
        if (current == null || current.finished) {
            current = PipelineTx.create();
            emit(PipelineStage.RECEIVED, PipelineStageStatus.PROCESSING, "송금 요청을 접수하고 있습니다");
            return;
        }

        PipelineStage stage = STAGES[current.stageIndex];

        // 이상거래 검증 단계에서 일부 거래를 차단(실패) 처리 → 실패 애니메이션 시연
        if (stage == PipelineStage.RISK_CHECK && current.willFail) {
            current.finished = true;
            emit(PipelineStage.RISK_CHECK, PipelineStageStatus.FAILED, "이상거래로 판단되어 거래가 차단되었습니다");
            return;
        }

        // 마지막 단계(정산)까지 처리 중이었다면 완료 처리
        if (stage == PipelineStage.SETTLEMENT) {
            current.finished = true;
            emit(PipelineStage.SETTLEMENT, PipelineStageStatus.COMPLETED, "정산이 완료되어 거래가 종료되었습니다");
            return;
        }

        // 다음 단계로 진입(처리 중)
        current.stageIndex++;
        PipelineStage next = STAGES[current.stageIndex];
        emit(next, PipelineStageStatus.PROCESSING, messageFor(next));
    }

    private void emit(PipelineStage stage, PipelineStageStatus status, String message) {
        long elapsed = Duration.between(current.startedAt, Instant.now()).toMillis();
        TransactionPipelineEvent event = TransactionPipelineEvent.of(
                current.txId, stage, status,
                current.sender, current.receiver, current.amount,
                elapsed, message
        );
        eventBroadcaster.broadcastToSse(SSE_CHANNEL, event);
    }

    private static String messageFor(PipelineStage stage) {
        return switch (stage) {
            case RECEIVED -> "송금 요청을 접수하고 있습니다";
            case RISK_CHECK -> "이상거래 여부를 검증하고 있습니다";
            case LEDGER -> "분산 원장에 거래를 기록하고 있습니다";
            case SETTLEMENT -> "정산 처리를 진행하고 있습니다";
        };
    }

    // 가상 거래 상태 홀더
    private static final class PipelineTx {
        final String txId;
        final String sender;
        final String receiver;
        final BigDecimal amount;
        final boolean willFail;
        final Instant startedAt;
        int stageIndex;      // 현재 처리 중인 단계 인덱스(0~3)
        boolean finished;

        private PipelineTx(String txId, String sender, String receiver, BigDecimal amount, boolean willFail) {
            this.txId = txId;
            this.sender = sender;
            this.receiver = receiver;
            this.amount = amount;
            this.willFail = willFail;
            this.startedAt = Instant.now();
            this.stageIndex = 0;
            this.finished = false;
        }

        static PipelineTx create() {
            ThreadLocalRandom rnd = ThreadLocalRandom.current();
            String txId = "TX" + (100000 + rnd.nextInt(900000));
            String sender = "#" + (1000 + rnd.nextInt(9000));
            String receiver = "#" + (1000 + rnd.nextInt(9000));
            BigDecimal amount = BigDecimal.valueOf((rnd.nextInt(500) + 1) * 1000L);
            boolean willFail = rnd.nextInt(100) < 15; // 약 15% 차단
            return new PipelineTx(txId, sender, receiver, amount, willFail);
        }
    }
}
