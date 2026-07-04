package com.example.ezpay.modules.auth.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;

/**
 * 소셜 로그인용 HTTP 클라이언트 설정.
 * 외부 제공자(카카오/네이버) 호출 시 무한 대기하지 않도록 타임아웃을 건 RestClient 를 제공한다.
 */
@Configuration
@EnableConfigurationProperties(OAuthProperties.class)
public class OAuthClientConfig {

    @Bean
    public RestClient oauthRestClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(5));
        return RestClient.builder()
                .requestFactory(factory)
                .build();
    }
}
