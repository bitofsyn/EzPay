package com.example.ezpay.modules.risk.repository;

import com.example.ezpay.modules.risk.entity.RiskLevel;
import com.example.ezpay.modules.risk.entity.RiskTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RiskTransactionRepository extends JpaRepository<RiskTransaction, Long> {

    List<RiskTransaction> findAllByOrderByTransactionDatetimeDesc();

    List<RiskTransaction> findAllByLevelOrderByTransactionDatetimeDesc(RiskLevel level);

    Optional<RiskTransaction> findByTransactionId(String transactionId);
}
