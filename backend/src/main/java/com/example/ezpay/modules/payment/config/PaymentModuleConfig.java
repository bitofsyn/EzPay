package com.example.ezpay.modules.payment.config;

import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/**
 * Payment 모듈 설정
 */
@Configuration
@ComponentScan(basePackages = "com.example.ezpay.modules.payment")
@EnableJpaRepositories(basePackages = "com.example.ezpay.modules.payment.internal.repository")
@EntityScan(basePackages = "com.example.ezpay.modules.payment.internal.entity")
public class PaymentModuleConfig {
}
