package com.example.ezpay.modules.bankconnector.api.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class KftcSelectedAccountResult {
    Long userId;
    Long connectionId;
    String status;
    String message;
    String bankCodeStd;
    String accountNum;
    String accountSeq;
    String accountName;
    String accountLocalCode;
    boolean syncTriggered;
    Integer syncedRecordCount;
    String nextCursor;
    Boolean hasMore;
}
