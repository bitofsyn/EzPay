package com.example.ezpay.modules.bankconnector.api.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class KftcTransactionInquiryRequest {
    Long userId;
    String accessToken;
    String fintechUseNum;
    String bankTranId;
    String inquiryType;
    String inquiryBase;
    String fromDate;
    String toDate;
    String fromTime;
    String toTime;
    String sortOrder;
    String pageIndex;
    String pageRecordCnt;
    String beforInquiryTraceInfo;
}
