package com.example.ezpay.model.admin;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QAdminUsers is a Querydsl query type for AdminUsers
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QAdminUsers extends EntityPathBase<AdminUsers> {

    private static final long serialVersionUID = 1800482569L;

    public static final QAdminUsers adminUsers = new QAdminUsers("adminUsers");

    public final DateTimePath<java.sql.Timestamp> createdAt = createDateTime("createdAt", java.sql.Timestamp.class);

    public final StringPath email = createString("email");

    public final StringPath name = createString("name");

    public final StringPath passwordHash = createString("passwordHash");

    public final EnumPath<com.example.ezpay.model.enums.Status> status = createEnum("status", com.example.ezpay.model.enums.Status.class);

    public final DateTimePath<java.sql.Timestamp> updatedAt = createDateTime("updatedAt", java.sql.Timestamp.class);

    public final NumberPath<Long> userId = createNumber("userId", Long.class);

    public QAdminUsers(String variable) {
        super(AdminUsers.class, forVariable(variable));
    }

    public QAdminUsers(Path<? extends AdminUsers> path) {
        super(path.getType(), path.getMetadata());
    }

    public QAdminUsers(PathMetadata metadata) {
        super(AdminUsers.class, metadata);
    }

}

