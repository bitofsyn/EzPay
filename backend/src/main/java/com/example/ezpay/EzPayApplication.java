package com.example.ezpay;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@EnableJpaAuditing // JPA Auditing 활성화
@SpringBootApplication
@EntityScan("com.example.ezpay")
@EnableJpaRepositories("com.example.ezpay.*")
public class EzPayApplication {

    public static void main(String[] args) {
        SpringApplication.run(EzPayApplication.class, args);
    }

}
