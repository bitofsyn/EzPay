package com.example.ezpay.model.user;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QTransaction is a Querydsl query type for Transaction
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QTransaction extends EntityPathBase<Transaction> {

    private static final long serialVersionUID = 947879948L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QTransaction transaction = new QTransaction("transaction");

    public final NumberPath<java.math.BigDecimal> amount = createNumber("amount", java.math.BigDecimal.class);

    public final StringPath description = createString("description");

    public final QAccounts receiverAccount;

    public final QAccounts senderAccount;

    public final EnumPath<com.example.ezpay.model.enums.TransactionStatus> status = createEnum("status", com.example.ezpay.model.enums.TransactionStatus.class);

    public final DateTimePath<java.sql.Timestamp> transactionDate = createDateTime("transactionDate", java.sql.Timestamp.class);

    public final NumberPath<Integer> transactionId = createNumber("transactionId", Integer.class);

    public QTransaction(String variable) {
        this(Transaction.class, forVariable(variable), INITS);
    }

    public QTransaction(Path<? extends Transaction> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QTransaction(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QTransaction(PathMetadata metadata, PathInits inits) {
        this(Transaction.class, metadata, inits);
    }

    public QTransaction(Class<? extends Transaction> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.receiverAccount = inits.isInitialized("receiverAccount") ? new QAccounts(forProperty("receiverAccount"), inits.get("receiverAccount")) : null;
        this.senderAccount = inits.isInitialized("senderAccount") ? new QAccounts(forProperty("senderAccount"), inits.get("senderAccount")) : null;
    }

}

