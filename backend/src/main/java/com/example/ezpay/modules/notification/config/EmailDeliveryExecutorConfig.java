package com.example.ezpay.modules.notification.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

/**
 * 이메일 발송 전용 스레드 풀.
 * SMTP 왕복은 수백 ms~수 초가 걸리므로 송금 컨슈머 스레드(계좌 락 보유 중)에서 분리한다.
 * 큐가 가득 차면 작업을 버리고 PENDING 상태로 남겨 재시도 스케줄러가 이어받게 한다.
 */
@Slf4j
@Configuration
public class EmailDeliveryExecutorConfig {

    public static final String EMAIL_DELIVERY_EXECUTOR = "emailDeliveryExecutor";

    @Bean(name = EMAIL_DELIVERY_EXECUTOR)
    public ThreadPoolTaskExecutor emailDeliveryExecutor(
            @Value("${ezpay.notification.email.executor.pool-size:4}") int poolSize,
            @Value("${ezpay.notification.email.executor.queue-capacity:1000}") int queueCapacity) {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setThreadNamePrefix("email-delivery-");
        executor.setCorePoolSize(poolSize);
        executor.setMaxPoolSize(poolSize);
        executor.setQueueCapacity(queueCapacity);
        executor.setRejectedExecutionHandler((task, pool) ->
                log.warn("이메일 발송 큐가 가득 차 즉시 발송을 건너뜁니다. 재시도 스케줄러가 처리합니다."));
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(10);
        executor.initialize();
        return executor;
    }
}
