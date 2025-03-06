package com.example.ezpay.model.user;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QPasswordReset is a Querydsl query type for PasswordReset
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QPasswordReset extends EntityPathBase<PasswordReset> {

    private static final long serialVersionUID = 328529186L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QPasswordReset passwordReset = new QPasswordReset("passwordReset");

    public final DateTimePath<java.time.LocalDateTime> createdAt = createDateTime("createdAt", java.time.LocalDateTime.class);

    public final DateTimePath<java.time.LocalDateTime> expirationTime = createDateTime("expirationTime", java.time.LocalDateTime.class);

    public final NumberPath<Long> requestId = createNumber("requestId", Long.class);

    public final StringPath resetToken = createString("resetToken");

    public final BooleanPath used = createBoolean("used");

    public final QUser user;

    public QPasswordReset(String variable) {
        this(PasswordReset.class, forVariable(variable), INITS);
    }

    public QPasswordReset(Path<? extends PasswordReset> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QPasswordReset(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QPasswordReset(PathMetadata metadata, PathInits inits) {
        this(PasswordReset.class, metadata, inits);
    }

    public QPasswordReset(Class<? extends PasswordReset> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.user = inits.isInitialized("user") ? new QUser(forProperty("user")) : null;
    }

}

