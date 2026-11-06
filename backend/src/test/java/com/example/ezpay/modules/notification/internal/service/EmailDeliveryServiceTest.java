package com.example.ezpay.modules.notification.internal.service;

import com.example.ezpay.modules.notification.internal.entity.EmailDelivery;
import com.example.ezpay.modules.notification.internal.entity.EmailDeliveryStatus;
import com.example.ezpay.modules.notification.internal.repository.EmailDeliveryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class EmailDeliveryServiceTest {

    private EmailDeliveryRepository repository;
    private JavaMailSender mailSender;
    private EmailDeliveryService service;

    @BeforeEach
    void setUp() {
        repository = mock(EmailDeliveryRepository.class);
        mailSender = mock(JavaMailSender.class);
        service = new EmailDeliveryService(repository, mailSender);
        ReflectionTestUtils.setField(service, "maxAttempts", 3);
        ReflectionTestUtils.setField(service, "retryDelaySeconds", 60L);
        when(repository.save(any(EmailDelivery.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void recordsSuccessfulDelivery() {
        service.send("user@example.com", "제목", "내용", "TRANSFER_COMPLETED", "tx-1");

        verify(mailSender).send(any(SimpleMailMessage.class));
        EmailDelivery saved = captureLastSaved();
        assertThat(saved.getStatus()).isEqualTo(EmailDeliveryStatus.SENT);
        assertThat(saved.getAttempts()).isEqualTo(1);
        assertThat(saved.getSentAt()).isNotNull();
        assertThat(saved.getNextRetryAt()).isNull();
    }

    @Test
    void schedulesRetryWhenSendingFails() {
        doThrow(new IllegalStateException("SMTP unavailable"))
                .when(mailSender).send(any(SimpleMailMessage.class));

        service.send("user@example.com", "제목", "내용", "SECURITY", null);

        EmailDelivery saved = captureLastSaved();
        assertThat(saved.getStatus()).isEqualTo(EmailDeliveryStatus.RETRYING);
        assertThat(saved.getAttempts()).isEqualTo(1);
        assertThat(saved.getNextRetryAt()).isNotNull();
        assertThat(saved.getLastError()).contains("SMTP unavailable");
    }

    private EmailDelivery captureLastSaved() {
        var captor = org.mockito.ArgumentCaptor.forClass(EmailDelivery.class);
        verify(repository, atLeastOnce()).save(captor.capture());
        return captor.getAllValues().get(captor.getAllValues().size() - 1);
    }
}
