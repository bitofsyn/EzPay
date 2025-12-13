package com.example.ezpay.repository.user.impl;

import com.example.ezpay.model.user.QAccounts;
import com.example.ezpay.model.user.QUser;
import com.example.ezpay.model.user.Transaction;
import com.example.ezpay.repository.queryDSL.TransactionRepositoryCustom;
import com.example.ezpay.shared.common.enums.TransactionStatus;
import com.querydsl.core.BooleanBuilder;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class TransactionRepositoryImpl implements TransactionRepositoryCustom {
// ... (previous methods)

    @Override
    public BigDecimal sumTodayTransactionBySender(Long senderAccountId, LocalDate today) {
        QTransaction transaction = QTransaction.transaction;

        Timestamp start = Timestamp.from(today.atStartOfDay(ZoneId.systemDefault()).toInstant());
        Timestamp end = Timestamp.from(today.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant());

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
    public List<Transaction> searchTransactions(Long userId, String keyword, LocalDate startDate, LocalDate endDate) {
        QTransaction transaction = QTransaction.transaction;
        QAccounts senderAccount = new QAccounts("senderAccount");
        QAccounts receiverAccount = new QAccounts("receiverAccount");
        QUser senderUser = new QUser("senderUser");
        QUser receiverUser = new QUser("receiverUser");

        BooleanBuilder builder = new BooleanBuilder();

        // 사용자 ID 조건 (송신자 또는 수신자)
        builder.and(transaction.senderAccount.user.userId.eq(userId)
                .or(transaction.receiverAccount.user.userId.eq(userId)));

        // 키워드 조건 (메모 또는 상대방 이름)
        if (StringUtils.hasText(keyword)) {
            builder.and(
                transaction.memo.containsIgnoreCase(keyword)
                // 내가 송신자일 경우 수신자 이름에서 검색
                .or(transaction.senderAccount.user.userId.eq(userId)
                        .and(transaction.receiverAccount.user.name.containsIgnoreCase(keyword)))
                // 내가 수신자일 경우 송신자 이름에서 검색
                .or(transaction.receiverAccount.user.userId.eq(userId)
                        .and(transaction.senderAccount.user.name.containsIgnoreCase(keyword)))
            );
        }

        // 날짜 범위 조건
        if (startDate != null && endDate != null) {
            Timestamp start = Timestamp.valueOf(startDate.atStartOfDay());
            Timestamp end = Timestamp.valueOf(endDate.atTime(LocalTime.MAX));
            builder.and(transaction.transactionDate.between(start, end));
        }

        // 성공한 거래만 조회
        builder.and(transaction.status.eq(TransactionStatus.SUCCESS));

        return queryFactory
                .selectFrom(transaction)
                .join(transaction.senderAccount, senderAccount).fetchJoin()
                .join(senderAccount.user, senderUser).fetchJoin()
                .join(transaction.receiverAccount, receiverAccount).fetchJoin()
                .join(receiverAccount.user, receiverUser).fetchJoin()
                .where(builder)
                .orderBy(transaction.transactionDate.desc())
                .fetch();
    }
}
