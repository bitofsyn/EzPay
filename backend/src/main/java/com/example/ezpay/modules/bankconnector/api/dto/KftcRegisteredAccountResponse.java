package com.example.ezpay.modules.bankconnector.api.dto;

import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class KftcRegisteredAccountResponse {
    String apiTranId;
    String apiTranDtm;
    String rspCode;
    String rspMessage;
    String userSeqNo;
    String userName;
    String resCnt;
    List<KftcRegisteredAccountItem> resList;
}
