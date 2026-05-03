package com.example.ezpay.modules.bankconnector.api.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class KftcAccountInfoItem {
    String bankCodeStd;
    String activityType;
    String accountType;
    String accountNum;
    String accountSeq;
    String accountLocalCode;
    String accountIssueDate;
    String maturityDate;
    String lastTranDate;
    String productName;
    String productSubName;
    String dormancyYn;
    String balanceAmt;
    String availableAmt;
}
