package com.example.ezpay.model.user;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QTransactionFilter is a Querydsl query type for TransactionFilter
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QTransactionFilter extends EntityPathBase<TransactionFilter> {

    private static final long serialVersionUID = -1290273116L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QTransactionFilter transactionFilter = new QTransactionFilter("transactionFilter");

    public final DateTimePath<java.sql.Timestamp> createdAt = createDateTime("createdAt", java.sql.Timestamp.class);

    public final DatePath<java.time.LocalDate> endDate = createDate("endDate", java.time.LocalDate.class);

    public final NumberPath<Long> filterId = createNumber("filterId", Long.class);

    public final NumberPath<java.math.BigDecimal> maxAmount = createNumber("maxAmount", java.math.BigDecimal.class);

    public final NumberPath<java.math.BigDecimal> minAmount = createNumber("minAmount", java.math.BigDecimal.class);

    public final DatePath<java.time.LocalDate> startDate = createDate("startDate", java.time.LocalDate.class);

    public final QUser user;

    public QTransactionFilter(String variable) {
        this(TransactionFilter.class, forVariable(variable), INITS);
    }

    public QTransactionFilter(Path<? extends TransactionFilter> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QTransactionFilter(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QTransactionFilter(PathMetadata metadata, PathInits inits) {
        this(TransactionFilter.class, metadata, inits);
    }

    public QTransactionFilter(Class<? extends TransactionFilter> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.user = inits.isInitialized("user") ? new QUser(forProperty("user")) : null;
    }

}

