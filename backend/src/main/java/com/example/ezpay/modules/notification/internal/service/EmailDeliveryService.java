package com.example.ezpay.modules.notification.internal.service;

import com.example.ezpay.modules.notification.internal.entity.EmailDelivery;
import com.example.ezpay.modules.notification.internal.entity.EmailDeliveryStatus;
import com.example.ezpay.modules.notification.internal.repository.EmailDeliveryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailDeliveryService {

    private final EmailDeliveryRepository emailDeliveryRepository;
    private final JavaMailSender mailSender;

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
                .nextRetryAt(LocalDateTime.now())
                .build());

        attempt(delivery);
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
