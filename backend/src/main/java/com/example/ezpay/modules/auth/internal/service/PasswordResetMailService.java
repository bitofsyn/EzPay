package com.example.ezpay.modules.auth.internal.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class PasswordResetMailService {

    private final JavaMailSender mailSender;
    private final String frontendBaseUrl;

    public PasswordResetMailService(JavaMailSender mailSender,
                                    @Value("${app.frontend-base-url:http://localhost:5173}") String frontendBaseUrl) {
        this.mailSender = mailSender;
        this.frontendBaseUrl = frontendBaseUrl;
    }

    public void sendResetLink(String email, String token, long expirationMinutes) {
        String resetUrl = UriComponentsBuilder.fromUriString(frontendBaseUrl)
                .path("/reset-password")
                .queryParam("token", token)
                .build()
                .encode()
                .toUriString();

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("[EzPay] 비밀번호 재설정 안내");
        message.setText("아래 링크에서 비밀번호를 재설정해 주세요.\n\n"
                + resetUrl + "\n\n"
                + "링크는 " + expirationMinutes + "분 동안 유효합니다. 요청하지 않았다면 이 메일을 무시해 주세요.");
        mailSender.send(message);
    }

    public void sendPasswordChanged(String email) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("[EzPay] 비밀번호 변경 완료");
        message.setText("비밀번호가 변경되었습니다. 본인이 변경하지 않았다면 즉시 고객센터에 문의해 주세요.");
        mailSender.send(message);
    }
}
