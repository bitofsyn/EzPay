package com.example.ezpay.modules.user.config;

import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/**
 * User 모듈 설정
 */
@Configuration
@ComponentScan(basePackages = "com.example.ezpay.modules.user")
@EnableJpaRepositories(basePackages = "com.example.ezpay.modules.user.internal.repository")
@EntityScan(basePackages = "com.example.ezpay.modules.user.internal.entity")
public class UserModuleConfig {
}
