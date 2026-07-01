package com.example.ezpay.shared.config;

import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.PersistenceContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.transaction.PlatformTransactionManager;

// 모듈별 Config(@EnableJpaRepositories("...modules.*.internal.repository"))가 커버하지 않는
// 레거시/공유 리포지토리 패키지를 등록한다. 모듈 internal.repository와 겹치지 않아 중복 Bean이 발생하지 않는다.
@Configuration
@EnableJpaRepositories(basePackages = {
        "com.example.ezpay.repository",
        "com.example.ezpay.modules.kafka.repository",
        "com.example.ezpay.modules.systemlog.repository",
        "com.example.ezpay.modules.risk.repository"
})
public class JpaConfig {
    @PersistenceContext
    private EntityManager entityManager;

    @Bean
    public JPAQueryFactory jpaQueryFactory() {
        return new JPAQueryFactory(entityManager);
    }

    /**
     * ✅ KafkaTransactionManager (트랜잭션 지원)
     */
    @Bean
    @Primary // 기본 트랜잭션 매니저로 설정
    public PlatformTransactionManager transactionManager(EntityManagerFactory emf) {
        return new JpaTransactionManager(emf);
    }
}
