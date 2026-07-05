package com.example.ezpay.modules.risk.fds;

/**
 * 사전 위험도 분석(FDS) 판정 결과.
 * 송금 원장 기록 직전에 평가되어 송금 진행 여부를 결정한다.
 */
public enum FraudDecision {
    APPROVE, // 정상 - 송금 진행
    REVIEW,  // 통과시키되 관리자 검토 큐에 적재(모니터링)
    HOLD,    // 일시 보류 - 송금 미완료(주로 FDS 장애 fallback)
    BLOCK    // 차단 - 송금 실패 처리
}
