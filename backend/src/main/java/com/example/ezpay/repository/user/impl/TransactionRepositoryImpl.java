package com.example.ezpay.repository.user.impl;

import com.example.ezpay.model.user.QAccounts;
import com.example.ezpay.model.user.QTransaction;
import com.example.ezpay.model.user.QUser;
import com.example.ezpay.model.user.Transaction;
import com.example.ezpay.repository.queryDSL.TransactionRepositoryCustom;
import com.example.ezpay.response.SpendingSummaryDto;
import com.example.ezpay.shared.common.enums.TransactionStatus;
import com.querydsl.jpa.impl.JPAQuery;
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

    private static final QTransaction transaction = QTransaction.transaction;
    private static final QAccounts sender = new QAccounts("sender");
    private static final QAccounts receiver = new QAccounts("receiver");
    private static final QUser senderUser = new QUser("senderUser");
    private static final QUser receiverUser = new QUser("receiverUser");

    private final JPAQueryFactory queryFactory;

    /**
     * 거래를 송금·수취 계좌와 각 소유자까지 한 번에 읽는다.
     * 컨트롤러가 Transaction 엔티티를 그대로 직렬화하면서 계좌 소유자 이름(ownerName)을 노출하므로,
     * open-in-view 가 꺼진 상태에서도 트랜잭션 밖에서 지연 로딩 없이 접근할 수 있어야 한다(N+1 방지 겸).
     */
    private JPAQuery<Transaction> selectWithParties() {
        return queryFactory
                .selectFrom(transaction)
                .join(transaction.senderAccount, sender).fetchJoin()
                .join(sender.user, senderUser).fetchJoin()
                .join(transaction.receiverAccount, receiver).fetchJoin()
                .join(receiver.user, receiverUser).fetchJoin();
    }

    @Override
    public List<Transaction> findTransactionByAccount(Long accountId) {
        return selectWithParties()
                .where(sender.accountId.eq(accountId)
                        .or(receiver.accountId.eq(accountId)))
                .fetch();
    }

    @Override
    public List<Transaction> findSentTransactions(Long senderAccountId) {
        return selectWithParties()
                .where(sender.accountId.eq(senderAccountId))
                .fetch();
    }

    @Override
    public List<Transaction> findReceivedTransactions(Long receiverAccountId) {
        return selectWithParties()
                .where(receiver.accountId.eq(receiverAccountId))
                .fetch();
    }

    @Override
    public BigDecimal sumTodayTransactionBySender(Long senderAccountId, LocalDate today) {
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
        com.querydsl.core.BooleanBuilder conditions = new com.querydsl.core.BooleanBuilder()
                .and(senderUser.userId.eq(userId)
                        .or(receiverUser.userId.eq(userId)));

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

        return selectWithParties()
                .where(conditions)
                .orderBy(transaction.transactionDate.desc())
                .fetch();
    }
}
