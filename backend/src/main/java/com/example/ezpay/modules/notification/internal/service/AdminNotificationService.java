package com.example.ezpay.modules.notification.internal.service;

import com.example.ezpay.modules.risk.entity.RiskLevel;
import com.example.ezpay.modules.risk.entity.RiskTransaction;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminNotificationService {

    private final EmailDeliveryService emailDeliveryService;

    @Value("${ezpay.notification.admin-email:}")
    private String adminEmail;

    public void notifyRiskDetected(RiskTransaction riskTransaction) {
        if (adminEmail == null || adminEmail.isBlank() || riskTransaction.getLevel() == RiskLevel.SAFE) {
            return;
        }

        emailDeliveryService.send(
                adminEmail,
                "[EzPay] 위험 거래 감지",
                String.format(
                        "거래 %s에서 %s 위험이 감지되었습니다.%n송금인: %s%n수취인: %s%n금액: %,.0f원%n사유: %s",
                        riskTransaction.getTransactionId(),
                        riskTransaction.getLevel(),
                        riskTransaction.getSender(),
                        riskTransaction.getReceiver(),
                        riskTransaction.getAmount(),
                        riskTransaction.getReason()
                ),
                "RISK_DETECTED",
                riskTransaction.getTransactionId()
        );
    }
}
