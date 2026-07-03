package com.example.ezpay.modules.realtime.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

// SSE 채널 "transaction-pipeline"로 전송되는 파이프라인 단계 전이 이벤트.
// 하나의 이벤트가 특정 거래의 현재 파이프라인 상태(어느 단계가 처리 중/실패인지)를
// 완전히 서술하므로, 프론트엔드는 stage+stageIndex+stageStatus만으로 스텝 전체를 렌더할 수 있다.
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionPipelineEvent {

    private String txId;              // 거래 식별자 (예: TX12345)
    private PipelineStage stage;      // 현재 단계
    private int stageIndex;           // 현재 단계 인덱스(0~3) — 프론트 Stepper 동기화용
    private PipelineStageStatus stageStatus; // 현재 단계 상태
    private String sender;            // 송금 경로(출금)
    private String receiver;          // 송금 경로(입금)
    private BigDecimal amount;        // 거래 금액
    private long elapsedMs;           // 요청 접수 후 경과 시간(ms)
    private String message;           // 사람이 읽는 상태 메시지
    private LocalDateTime occurredAt; // 이벤트 발생 시각

    public static TransactionPipelineEvent of(
            String txId,
            PipelineStage stage,
            PipelineStageStatus status,
            String sender,
            String receiver,
            BigDecimal amount,
            long elapsedMs,
            String message
    ) {
        return TransactionPipelineEvent.builder()
                .txId(txId)
                .stage(stage)
                .stageIndex(stage.getIndex())
                .stageStatus(status)
                .sender(sender)
                .receiver(receiver)
                .amount(amount)
                .elapsedMs(elapsedMs)
                .message(message)
                .occurredAt(LocalDateTime.now())
                .build();
    }
}
