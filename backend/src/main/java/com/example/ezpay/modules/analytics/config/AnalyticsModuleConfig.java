package com.example.ezpay.modules.analytics.config;

import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/**
 * Analytics 모듈 설정
 */
@Configuration
@ComponentScan(basePackages = "com.example.ezpay.modules.analytics")
@EnableJpaRepositories(basePackages = "com.example.ezpay.modules.analytics.internal.repository")
@EntityScan(basePackages = "com.example.ezpay.modules.analytics.internal.entity")
public class AnalyticsModuleConfig {
}
