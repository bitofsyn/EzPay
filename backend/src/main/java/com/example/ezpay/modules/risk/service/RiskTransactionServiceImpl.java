package com.example.ezpay.modules.risk.service;

import com.example.ezpay.modules.realtime.EventBroadcaster;
import com.example.ezpay.modules.risk.dto.RiskActionResult;
import com.example.ezpay.modules.risk.dto.RiskTransactionInfo;
import com.example.ezpay.modules.risk.entity.RiskLevel;
import com.example.ezpay.modules.risk.entity.RiskTransaction;
import com.example.ezpay.modules.risk.repository.RiskTransactionRepository;
import com.example.ezpay.shared.exception.CustomNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RiskTransactionServiceImpl implements RiskTransactionService {

    private static final String TOPIC_RISK_TRANSACTIONS = "admin:dashboard:risk-transactions";

    private final RiskTransactionRepository riskTransactionRepository;
    private final EventBroadcaster eventBroadcaster;

    @Override
    @Transactional(readOnly = true)
    public List<RiskTransactionInfo> getRiskTransactions(String filter) {
        RiskLevel level = parseFilter(filter);

        List<RiskTransaction> riskTransactions = level != null
                ? riskTransactionRepository.findAllByLevelOrderByTransactionDatetimeDesc(level)
                : riskTransactionRepository.findAllByOrderByTransactionDatetimeDesc();

        return riskTransactions.stream()
                .map(RiskTransactionInfo::from)
                .toList();
    }

    @Override
    @Transactional
    public RiskActionResult approve(String transactionId) {
        RiskTransaction riskTransaction = getByTransactionId(transactionId);
        riskTransaction.approve();
        return RiskActionResult.from(riskTransaction);
    }

    @Override
    @Transactional
    public RiskActionResult block(String transactionId) {
        RiskTransaction riskTransaction = getByTransactionId(transactionId);
        riskTransaction.block();
        return RiskActionResult.from(riskTransaction);
    }

    @Override
    @Transactional
    public RiskTransaction save(RiskTransaction riskTransaction) {
        RiskTransaction saved = riskTransactionRepository.save(riskTransaction);
        eventBroadcaster.broadcastToTopic(TOPIC_RISK_TRANSACTIONS, RiskTransactionInfo.from(saved));
        return saved;
    }

    @Override
    public RiskLevel parseFilter(String filter) {
        if (filter == null || filter.isBlank() || "전체".equals(filter) || "ALL".equalsIgnoreCase(filter)) {
            return null;
        }
        try {
            return RiskLevel.valueOf(filter.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private RiskTransaction getByTransactionId(String transactionId) {
        return riskTransactionRepository.findByTransactionId(transactionId)
                .orElseThrow(() -> new CustomNotFoundException("위험 거래를 찾을 수 없습니다: " + transactionId));
    }
}
