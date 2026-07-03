package com.example.ezpay.modules.realtime.dto;

// 특정 단계(PipelineStage)의 현재 진행 상태
public enum PipelineStageStatus {
    PENDING,     // 아직 도달하지 않은 단계
    PROCESSING,  // 현재 처리 중(로딩/스켈레톤 표시 대상)
    COMPLETED,   // 정상 완료
    FAILED       // 실패(파이프라인 중단)
}
