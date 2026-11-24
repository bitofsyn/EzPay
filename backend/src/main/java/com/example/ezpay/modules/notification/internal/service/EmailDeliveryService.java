package com.example.ezpay.modules.notification.internal.service;

import com.example.ezpay.modules.notification.internal.entity.EmailDelivery;
import com.example.ezpay.modules.notification.internal.entity.EmailDeliveryStatus;
import com.example.ezpay.modules.notification.internal.repository.EmailDeliveryRepository;
import com.example.ezpay.modules.notification.config.EmailDeliveryExecutorConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.Executor;

/**
 * 이메일 발송 이력(아웃박스) 기록과 실제 SMTP 발송을 분리한다.
 * <p>{@link #send}는 PENDING 이력만 남기고 즉시 반환하며, SMTP 발송은 이력이 커밋된 뒤 전용 스레드 풀에서 수행한다.
 * 호출자(예: 계좌 락을 잡은 송금 컨슈머)가 SMTP 왕복을 기다리지 않게 하기 위함이다.
 * 비동기 발송이 유실되더라도(큐 포화·프로세스 종료) PENDING 이력은 재시도 스케줄러가 이어서 처리한다.
 */
@Slf4j
@Service
public class EmailDeliveryService {

    private final EmailDeliveryRepository emailDeliveryRepository;
    private final JavaMailSender mailSender;
    private final Executor emailDeliveryExecutor;

    public EmailDeliveryService(EmailDeliveryRepository emailDeliveryRepository,
                                JavaMailSender mailSender,
                                @Qualifier(EmailDeliveryExecutorConfig.EMAIL_DELIVERY_EXECUTOR) Executor emailDeliveryExecutor) {
        this.emailDeliveryRepository = emailDeliveryRepository;
        this.mailSender = mailSender;
        this.emailDeliveryExecutor = emailDeliveryExecutor;
    }

    @Value("${ezpay.notification.email.max-attempts:3}")
    private int maxAttempts;

    @Value("${ezpay.notification.email.retry-delay-seconds:60}")
    private long retryDelaySeconds;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void send(String recipient, String subject, String body, String eventType, String referenceId) {
        EmailDelivery delivery = emailDeliveryRepository.save(EmailDelivery.builder()
                .recipient(recipient)
                .subject(subject)
                .body(body)
                .eventType(eventType)
                .referenceId(referenceId)
                .status(EmailDeliveryStatus.PENDING)
                .attempts(0)
                // 즉시 발송은 비동기 작업이 맡는다. 스케줄러는 그 작업이 유실됐을 때만 이어받도록 한 주기 늦춘다.
                .nextRetryAt(LocalDateTime.now().plusSeconds(retryDelaySeconds))
                .build());

        Runnable dispatch = () -> emailDeliveryExecutor.execute(() -> attempt(delivery));
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    dispatch.run();
                }
            });
        } else {
            dispatch.run();
        }
    }

    @Scheduled(fixedDelayString = "${ezpay.notification.email.retry-interval-ms:30000}")
    @Transactional
    public void retryPendingDeliveries() {
        List<EmailDelivery> pending = emailDeliveryRepository
                .findByStatusInAndNextRetryAtLessThanEqualOrderByCreatedAtAsc(
                        List.of(EmailDeliveryStatus.PENDING, EmailDeliveryStatus.RETRYING),
                        LocalDateTime.now(),
                        PageRequest.of(0, 50)
                );
        pending.forEach(this::attempt);
    }

    private void attempt(EmailDelivery delivery) {
        delivery.setAttempts(delivery.getAttempts() + 1);
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(delivery.getRecipient());
            message.setSubject(delivery.getSubject());
            message.setText(delivery.getBody());
            mailSender.send(message);

            delivery.setStatus(EmailDeliveryStatus.SENT);
            delivery.setSentAt(LocalDateTime.now());
            delivery.setNextRetryAt(null);
            delivery.setLastError(null);
        } catch (Exception exception) {
            delivery.setLastError(limit(exception.getMessage(), 2000));
            if (delivery.getAttempts() >= maxAttempts) {
                delivery.setStatus(EmailDeliveryStatus.FAILED);
                delivery.setNextRetryAt(null);
                log.error("이메일 발송 최종 실패: deliveryId={}, eventType={}, attempts={}",
                        delivery.getId(), delivery.getEventType(), delivery.getAttempts(), exception);
            } else {
                delivery.setStatus(EmailDeliveryStatus.RETRYING);
                delivery.setNextRetryAt(LocalDateTime.now().plusSeconds(retryDelaySeconds));
                log.warn("이메일 발송 실패, 재시도 예약: deliveryId={}, attempt={}/{}",
                        delivery.getId(), delivery.getAttempts(), maxAttempts);
            }
        }
        emailDeliveryRepository.save(delivery);
    }

    private String limit(String value, int maxLength) {
        if (value == null) {
            return "알 수 없는 이메일 발송 오류";
        }
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }
}
