package com.example.ezpay.modules.bankconnector.api.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class KftcTransactionInquiryItem {
    String tranDate;
    String tranTime;
    String inoutType;
    String tranType;
    String printedContent;
    String tranAmt;
    String afterBalanceAmt;
    String branchName;
}
