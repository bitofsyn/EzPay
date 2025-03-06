package com.example.ezpay.model.user;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QErrorLog is a Querydsl query type for ErrorLog
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QErrorLog extends EntityPathBase<ErrorLog> {

    private static final long serialVersionUID = 496291246L;

    public static final QErrorLog errorLog = new QErrorLog("errorLog");

    public final StringPath errorMessage = createString("errorMessage");

    public final NumberPath<Long> logId = createNumber("logId", Long.class);

    public final DateTimePath<java.sql.Timestamp> occurredAt = createDateTime("occurredAt", java.sql.Timestamp.class);

    public final StringPath serviceName = createString("serviceName");

    public final EnumPath<com.example.ezpay.model.enums.ErrorLogStatus> status = createEnum("status", com.example.ezpay.model.enums.ErrorLogStatus.class);

    public QErrorLog(String variable) {
        super(ErrorLog.class, forVariable(variable));
    }

    public QErrorLog(Path<? extends ErrorLog> path) {
        super(path.getType(), path.getMetadata());
    }

    public QErrorLog(PathMetadata metadata) {
        super(ErrorLog.class, metadata);
    }

}

