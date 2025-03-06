package com.example.ezpay.model.user;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QTransferLimit is a Querydsl query type for TransferLimit
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QTransferLimit extends EntityPathBase<TransferLimit> {

    private static final long serialVersionUID = -2100496322L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QTransferLimit transferLimit = new QTransferLimit("transferLimit");

    public final NumberPath<java.math.BigDecimal> dailyLimit = createNumber("dailyLimit", java.math.BigDecimal.class);

    public final NumberPath<java.math.BigDecimal> perTransactionLimit = createNumber("perTransactionLimit", java.math.BigDecimal.class);

    public final QUser user;

    public final NumberPath<Long> userId = createNumber("userId", Long.class);

    public QTransferLimit(String variable) {
        this(TransferLimit.class, forVariable(variable), INITS);
    }

    public QTransferLimit(Path<? extends TransferLimit> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QTransferLimit(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QTransferLimit(PathMetadata metadata, PathInits inits) {
        this(TransferLimit.class, metadata, inits);
    }

    public QTransferLimit(Class<? extends TransferLimit> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.user = inits.isInitialized("user") ? new QUser(forProperty("user")) : null;
    }

}

