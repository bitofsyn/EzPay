package com.example.ezpay.modules.realtime.dto;

// 실시간 트랜잭션 처리 파이프라인의 4개 주요 단계
// 프론트엔드 Stepper(관리자 대시보드)와 stageIndex(0~3)로 동기화된다.
public enum PipelineStage {
    RECEIVED(0, "송금 요청 접수"),
    RISK_CHECK(1, "이상거래 검증"),
    LEDGER(2, "분산 원장 기록"),
    SETTLEMENT(3, "정산 및 완료");

    private final int index;
    private final String label;

    PipelineStage(int index, String label) {
        this.index = index;
        this.label = label;
    }

    public int getIndex() {
        return index;
    }

    public String getLabel() {
        return label;
    }
}
