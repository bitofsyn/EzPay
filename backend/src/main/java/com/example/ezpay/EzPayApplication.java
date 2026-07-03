package com.example.ezpay;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

import java.util.TimeZone;

@EnableJpaAuditing // JPA Auditing 활성화
@SpringBootApplication
@EntityScan("com.example.ezpay")
public class EzPayApplication {

    public static void main(String[] args) {
        // JVM 기본 시간대를 Asia/Seoul로 고정한다.
        // @CreationTimestamp(트랜잭션 일시)와 ZoneId.systemDefault() 변환이 모두 KST 기준으로 통일되어,
        // 컨테이너(UTC 등)에서 기동해도 관리자 대시보드의 실시간 트랜잭션 로그 시각이 현재 시각과 일치한다.
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Seoul"));
        SpringApplication.run(EzPayApplication.class, args);
    }

}
