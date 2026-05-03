package com.example.ezpay.repository.user;

import com.example.ezpay.model.user.NormalizedTransaction;
import com.example.ezpay.shared.common.enums.FinancialDataProvider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.time.OffsetDateTime;

public interface NormalizedTransactionRepository extends JpaRepository<NormalizedTransaction, Long> {
    Optional<NormalizedTransaction> findByProviderAndProviderTransactionId(FinancialDataProvider provider, String providerTransactionId);

    boolean existsByProviderAndProviderTransactionId(FinancialDataProvider provider, String providerTransactionId);

    List<NormalizedTransaction> findByUserUserIdOrderByPostedAtDesc(Long userId);

    List<NormalizedTransaction> findByConnectionConnectionIdOrderByPostedAtDesc(Long connectionId);

    List<NormalizedTransaction> findByConnectionConnectionIdAndUserUserIdOrderByPostedAtDesc(Long connectionId, Long userId);

    List<NormalizedTransaction> findTop20ByUserUserIdOrderByPostedAtDesc(Long userId);

    List<NormalizedTransaction> findByUserUserIdAndPostedAtBetweenOrderByPostedAtDesc(Long userId, OffsetDateTime start, OffsetDateTime end);
}
