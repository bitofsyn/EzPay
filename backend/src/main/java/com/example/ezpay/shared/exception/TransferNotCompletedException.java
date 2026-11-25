package com.example.ezpay.shared.exception;

import com.example.ezpay.shared.common.enums.TransactionStatus;
import lombok.Getter;

/**
 * 송금을 동기로 처리했지만 성공하지 못한 경우(검증 실패·FDS 차단·FDS 보류).
 * 거래 이력은 해당 상태로 이미 기록되어 있고 잔액은 이동하지 않았다.
 */
@Getter
public class TransferNotCompletedException extends RuntimeException {

    private final String requestId;
    private final TransactionStatus status;

    public TransferNotCompletedException(String requestId, TransactionStatus status, String reason) {
        super(reason != null && !reason.isBlank() ? reason : defaultMessage(status));
        this.requestId = requestId;
        this.status = status;
    }

    private static String defaultMessage(TransactionStatus status) {
        return switch (status) {
            case BLOCKED -> "이상거래로 판단되어 송금이 차단되었습니다.";
            case HELD -> "송금이 보류되었습니다. 잠시 후 다시 시도해 주세요.";
            default -> "송금에 실패했습니다.";
        };
    }
}
