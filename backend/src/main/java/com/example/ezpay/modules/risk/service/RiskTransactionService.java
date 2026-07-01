package com.example.ezpay.modules.risk.service;

import com.example.ezpay.modules.risk.dto.RiskActionResult;
import com.example.ezpay.modules.risk.dto.RiskTransactionInfo;
import com.example.ezpay.modules.risk.entity.RiskLevel;
import com.example.ezpay.modules.risk.entity.RiskTransaction;

import java.util.List;

public interface RiskTransactionService {

    List<RiskTransactionInfo> getRiskTransactions(String filter);

    RiskActionResult approve(String transactionId);

    RiskActionResult block(String transactionId);

    RiskTransaction save(RiskTransaction riskTransaction);

    RiskLevel parseFilter(String filter);
}
