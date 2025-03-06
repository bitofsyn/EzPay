package com.example.ezpay.model.user;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QAccounts is a Querydsl query type for Accounts
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QAccounts extends EntityPathBase<Accounts> {

    private static final long serialVersionUID = 1258016120L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QAccounts accounts = new QAccounts("accounts");

    public final NumberPath<Long> accountId = createNumber("accountId", Long.class);

    public final StringPath accountNumber = createString("accountNumber");

    public final NumberPath<java.math.BigDecimal> balance = createNumber("balance", java.math.BigDecimal.class);

    public final StringPath bankName = createString("bankName");

    public final DateTimePath<java.sql.Timestamp> createdAt = createDateTime("createdAt", java.sql.Timestamp.class);

    public final QUser user;

    public QAccounts(String variable) {
        this(Accounts.class, forVariable(variable), INITS);
    }

    public QAccounts(Path<? extends Accounts> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QAccounts(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QAccounts(PathMetadata metadata, PathInits inits) {
        this(Accounts.class, metadata, inits);
    }

    public QAccounts(Class<? extends Accounts> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.user = inits.isInitialized("user") ? new QUser(forProperty("user")) : null;
    }

}

