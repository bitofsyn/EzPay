package com.example.ezpay.repository.user;

import com.example.ezpay.model.user.Accounts;
import com.example.ezpay.model.user.User;
import com.example.ezpay.shared.common.enums.Status;
import com.example.ezpay.shared.config.JpaConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:account-lock-test;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.sql.init.mode=never"
})
@Import(JpaConfig.class)
class AccountPessimisticLockIntegrationTest {

    @Autowired AccountRepository accountRepository;
    @Autowired UserRepository userRepository;
    @Autowired PlatformTransactionManager transactionManager;

    @Test
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    void concurrentWithdrawalsNeverMakeBalanceNegative() throws Exception {
        TransactionTemplate transaction = new TransactionTemplate(transactionManager);
        Long accountId = transaction.execute(status -> {
            User user = userRepository.save(User.builder()
                    .email("lock-test@example.com")
                    .password("password")
                    .name("lock-test")
                    .status(Status.ACTIVE)
                    .build());
            return accountRepository.save(Accounts.builder()
                    .user(user)
                    .accountNumber("LOCK-TEST-001")
                    .bankName("EzPay")
                    .balance(new BigDecimal("1000"))
                    .build()).getAccountId();
        });

        int requestCount = 20;
        ExecutorService executor = Executors.newFixedThreadPool(requestCount);
        CountDownLatch ready = new CountDownLatch(requestCount);
        CountDownLatch start = new CountDownLatch(1);
        AtomicInteger successes = new AtomicInteger();
        List<Future<?>> futures = new ArrayList<>();

        for (int i = 0; i < requestCount; i++) {
            futures.add(executor.submit(() -> {
                ready.countDown();
                start.await();
                try {
                    transaction.executeWithoutResult(status -> {
                        Accounts account = accountRepository.findByIdForUpdate(accountId).orElseThrow();
                        account.withdraw(new BigDecimal("100"));
                    });
                    successes.incrementAndGet();
                } catch (IllegalArgumentException ignored) {
                    // 잔액을 모두 사용한 뒤의 요청은 정상적으로 거부되어야 한다.
                }
                return null;
            }));
        }

        ready.await();
        start.countDown();
        for (Future<?> future : futures) {
            future.get();
        }
        executor.shutdown();

        BigDecimal finalBalance = transaction.execute(status ->
                accountRepository.findById(accountId).orElseThrow().getBalance());

        assertThat(successes.get()).isEqualTo(10);
        assertThat(finalBalance).isEqualByComparingTo(BigDecimal.ZERO);
    }
}
