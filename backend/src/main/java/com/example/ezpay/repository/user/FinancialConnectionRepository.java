package com.example.ezpay.repository.user;

import com.example.ezpay.model.user.FinancialConnection;
import com.example.ezpay.shared.common.enums.FinancialDataProvider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FinancialConnectionRepository extends JpaRepository<FinancialConnection, Long> {
    List<FinancialConnection> findByUserUserId(Long userId);

    Optional<FinancialConnection> findByConnectionReference(String connectionReference);

    List<FinancialConnection> findByUserUserIdAndProvider(Long userId, FinancialDataProvider provider);
}
