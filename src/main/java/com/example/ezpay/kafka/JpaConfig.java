package com.example.ezpay.kafka;

import jakarta.persistence.EntityManagerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.transaction.PlatformTransactionManager;

@Configuration
public class JpaConfig {

    /**
     * ✅ KafkaTransactionManager (트랜잭션 지원)
     */
    @Bean
    @Primary // 기본 트랜잭션 매니저로 설정
    public PlatformTransactionManager transactionManager(EntityManagerFactory emf) {
        return new JpaTransactionManager(emf);
    }
}
