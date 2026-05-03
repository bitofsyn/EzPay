package com.example.ezpay.modules.bankconnector.internal.service;

import com.example.ezpay.modules.bankconnector.api.dto.NormalizedTransactionResponse;
import com.example.ezpay.model.user.NormalizedTransaction;
import com.example.ezpay.repository.user.NormalizedTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NormalizedTransactionQueryServiceImpl implements NormalizedTransactionQueryService {
    private final NormalizedTransactionRepository normalizedTransactionRepository;

    @Override
    public List<NormalizedTransactionResponse> getTransactions(Long userId, Long connectionId) {
        List<NormalizedTransaction> transactions = connectionId == null
                ? normalizedTransactionRepository.findByUserUserIdOrderByPostedAtDesc(userId)
                : normalizedTransactionRepository.findByConnectionConnectionIdAndUserUserIdOrderByPostedAtDesc(connectionId, userId);

        return transactions.stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<NormalizedTransactionResponse> getRecentTransactions(Long userId, int limit) {
        return normalizedTransactionRepository.findTop20ByUserUserIdOrderByPostedAtDesc(userId).stream()
                .limit(limit)
                .map(this::toResponse)
                .toList();
    }

    private NormalizedTransactionResponse toResponse(NormalizedTransaction transaction) {
        return NormalizedTransactionResponse.builder()
                .normalizedTransactionId(transaction.getNormalizedTransactionId())
                .connectionId(transaction.getConnection().getConnectionId())
                .provider(transaction.getProvider())
                .providerTransactionId(transaction.getProviderTransactionId())
                .providerAccountId(transaction.getProviderAccountId())
                .postedAt(transaction.getPostedAt())
                .authorizedAt(transaction.getAuthorizedAt())
                .amount(transaction.getAmount())
                .currencyCode(transaction.getCurrencyCode())
                .direction(transaction.getDirection())
                .merchantName(transaction.getMerchantName())
                .description(transaction.getDescription())
                .primaryCategory(transaction.getPrimaryCategory())
                .detailedCategory(transaction.getDetailedCategory())
                .pending(transaction.isPending())
                .build();
    }
}
