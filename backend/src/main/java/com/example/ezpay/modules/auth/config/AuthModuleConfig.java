package com.example.ezpay.modules.auth.config;

import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/**
 * Auth 모듈 설정
 */
@Configuration
@ComponentScan(basePackages = "com.example.ezpay.modules.auth")
@EnableJpaRepositories(basePackages = "com.example.ezpay.modules.auth.internal.repository")
@EntityScan(basePackages = "com.example.ezpay.modules.auth.internal.entity")
public class AuthModuleConfig {
}
