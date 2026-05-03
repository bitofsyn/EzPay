package com.example.ezpay.modules.bankconnector.api.dto;

import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class KftcAccountInfoResponse {
    String apiTranId;
    String apiTranDtm;
    String rspCode;
    String rspMessage;
    String orgAinfoTranId;
    String traceNo;
    String totalRecordCnt;
    String pageRecordCnt;
    List<KftcAccountInfoItem> resList;
}
