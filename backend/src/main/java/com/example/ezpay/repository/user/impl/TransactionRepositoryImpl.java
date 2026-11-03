package com.example.ezpay.repository.user.impl;

import com.example.ezpay.model.user.QTransaction;
import com.example.ezpay.model.user.Transaction;
import com.example.ezpay.repository.queryDSL.TransactionRepositoryCustom;
import com.example.ezpay.response.SpendingSummaryDto;
import com.example.ezpay.shared.common.enums.TransactionStatus;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class TransactionRepositoryImpl implements TransactionRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public List<Transaction> findTransactionByAccount(Long accountId) {
        QTransaction transaction = QTransaction.transaction;

        return queryFactory
                .selectFrom(transaction)
                .where(transaction.senderAccount.accountId.eq(accountId)
                        .or(transaction.receiverAccount.accountId.eq(accountId)))
                .fetch();
    }

    @Override
    public List<Transaction> findSentTransactions(Long senderAccountId) {
        QTransaction transaction = QTransaction.transaction;

        return queryFactory
                .selectFrom(transaction)
                .where(transaction.senderAccount.accountId.eq(senderAccountId))
                .fetch();
    }

    @Override
    public List<Transaction> findReceivedTransactions(Long receiverAccountId) {
        QTransaction transaction = QTransaction.transaction;

        return queryFactory
                .selectFrom(transaction)
                .where(transaction.receiverAccount.accountId.eq(receiverAccountId))
                .fetch();
    }

    @Override
    public BigDecimal sumTodayTransactionBySender(Long senderAccountId, LocalDate today) {
        QTransaction transaction = QTransaction.transaction;

        Timestamp start = Timestamp.from(today.atStartOfDay(ZoneId.of("Asia/Seoul")).toInstant());
        Timestamp end = Timestamp.from(today.plusDays(1).atStartOfDay(ZoneId.of("Asia/Seoul")).toInstant());

        return queryFactory
                .select(transaction.amount.sum())
                .from(transaction)
                .where(transaction.senderAccount.accountId.eq(senderAccountId)
                        .and(transaction.status.eq(TransactionStatus.SUCCESS))
                        .and(transaction.transactionDate.goe(start))
                        .and(transaction.transactionDate.lt(end)))
                .fetchOne();
    }

    @Override
    public long countRecentTransfersBySender(Long senderAccountId, Timestamp since) {
        QTransaction transaction = QTransaction.transaction;

        // 처리 완료(SUCCESS) 및 처리 중(PROCESSING) 건을 모두 포함해 순간적인 반복 송금 시도를 포착한다.
        Long count = queryFactory
                .select(transaction.count())
                .from(transaction)
                .where(transaction.senderAccount.accountId.eq(senderAccountId)
                        .and(transaction.transactionDate.goe(since))
                        .and(transaction.status.in(TransactionStatus.SUCCESS, TransactionStatus.PROCESSING)))
                .fetchOne();

        return count == null ? 0L : count;
    }

    @Override
    public List<SpendingSummaryDto> getSpendingSummaryByCategory(
            Long userId, Timestamp start, Timestamp end) {
        QTransaction transaction = QTransaction.transaction;

        return queryFactory
                .select(com.querydsl.core.types.Projections.constructor(
                        SpendingSummaryDto.class,
                        transaction.category.coalesce("미분류"),
                        transaction.amount.sum()))
                .from(transaction)
                .where(transaction.senderAccount.user.userId.eq(userId)
                        .and(transaction.status.eq(TransactionStatus.SUCCESS))
                        .and(transaction.transactionDate.goe(start))
                        .and(transaction.transactionDate.lt(end)))
                .groupBy(transaction.category)
                .orderBy(transaction.amount.sum().desc())
                .fetch();
    }

    @Override
    public List<Transaction> searchTransactions(
            Long userId, String keyword, LocalDate startDate, LocalDate endDate) {
        QTransaction transaction = QTransaction.transaction;
        com.querydsl.core.BooleanBuilder conditions = new com.querydsl.core.BooleanBuilder()
                .and(transaction.senderAccount.user.userId.eq(userId)
                        .or(transaction.receiverAccount.user.userId.eq(userId)));

        if (keyword != null && !keyword.isBlank()) {
            String searchTerm = keyword.trim();
            conditions.and(transaction.memo.containsIgnoreCase(searchTerm)
                    .or(transaction.description.containsIgnoreCase(searchTerm))
                    .or(transaction.category.containsIgnoreCase(searchTerm)));
        }
        if (startDate != null) {
            conditions.and(transaction.transactionDate.goe(Timestamp.from(
                    startDate.atStartOfDay(ZoneId.of("Asia/Seoul")).toInstant())));
        }
        if (endDate != null) {
            conditions.and(transaction.transactionDate.lt(Timestamp.from(
                    endDate.plusDays(1).atStartOfDay(ZoneId.of("Asia/Seoul")).toInstant())));
        }

        return queryFactory.selectFrom(transaction)
                .where(conditions)
                .orderBy(transaction.transactionDate.desc())
                .fetch();
    }
}
