package com.example.ezpay.modules.bankconnector.api.dto;

import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class KftcTransactionInquiryResponse {
    String apiTranId;
    String apiTranDtm;
    String rspCode;
    String rspMessage;
    String bankTranId;
    String bankTranDate;
    String bankCodeTran;
    String bankRspCode;
    String bankRspMessage;
    String bankName;
    String savingsBankName;
    String fintechUseNum;
    String balanceAmt;
    String pageRecordCnt;
    String nextPageYn;
    String beforInquiryTraceInfo;
    List<KftcTransactionInquiryItem> resList;
}
