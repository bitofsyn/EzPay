package com.example.ezpay.modules.account.config;

import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/**
 * Account 모듈 설정
 */
@Configuration
@ComponentScan(basePackages = "com.example.ezpay.modules.account")
@EnableJpaRepositories(basePackages = "com.example.ezpay.modules.account.internal.repository")
@EntityScan(basePackages = "com.example.ezpay.modules.account.internal.entity")
public class AccountModuleConfig {
}
