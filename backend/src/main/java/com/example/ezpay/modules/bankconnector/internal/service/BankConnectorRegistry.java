package com.example.ezpay.modules.bankconnector.internal.service;

import com.example.ezpay.modules.bankconnector.api.BankConnector;
import com.example.ezpay.shared.common.enums.FinancialDataProvider;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Component
public class BankConnectorRegistry {
    private final List<BankConnector> connectors;
    private final Map<FinancialDataProvider, BankConnector> connectorMap = new EnumMap<>(FinancialDataProvider.class);

    public BankConnectorRegistry(List<BankConnector> connectors) {
        this.connectors = connectors;
    }

    @PostConstruct
    void initialize() {
        for (BankConnector connector : connectors) {
            connectorMap.put(connector.provider(), connector);
        }
    }

    public BankConnector get(FinancialDataProvider provider) {
        BankConnector connector = connectorMap.get(provider);
        if (connector == null) {
            throw new IllegalArgumentException("Unsupported financial data provider: " + provider);
        }
        return connector;
    }
}
