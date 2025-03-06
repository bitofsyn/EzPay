package com.example.ezpay.repository.user.impl;

import com.example.ezpay.model.user.QTransactionFilter;
import com.example.ezpay.model.user.TransactionFilter;
import com.example.ezpay.repository.queryDSL.TransactionFilterRepositoryCustom;
import com.example.ezpay.request.TransactionFilterRequest;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
@RequiredArgsConstructor
public class TransactionFilterRepositoryImpl implements TransactionFilterRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public List<TransactionFilter> searchFilters(TransactionFilterRequest transactionFilterRequest) {
        QTransactionFilter filter = QTransactionFilter.transactionFilter;

        return queryFactory
                .selectFrom(filter)
                .where(
                        filter.user.userId.eq(transactionFilterRequest.getUserId()),
                        transactionFilterRequest.getStartDate() != null ? filter.startDate.goe(transactionFilterRequest.getStartDate()) : null,
                        transactionFilterRequest.getEndDate() != null ? filter.endDate.loe(transactionFilterRequest.getEndDate()) : null,
                        transactionFilterRequest.getMinAmount() != null ? filter.minAmount.goe(transactionFilterRequest.getMinAmount()) : null,
                        transactionFilterRequest.getMaxAmount() != null ? filter.maxAmount.loe(transactionFilterRequest.getMaxAmount()) : null
                )
                .fetch();
    }
}
