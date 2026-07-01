package com.example.ezpay.modules.auth.api.dto;

import com.example.ezpay.modules.auth.internal.entity.PasswordReset;
import com.example.ezpay.model.user.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class PasswordResetRequest {
    @NotBlank(message = "이메일을 입력해주세요.")
    @Email(message = "유효한 이메일 주소를 입력해주세요.")
    private String email;

    public PasswordReset toEntity(User user, String token, LocalDateTime expirationTime) {
        return PasswordReset
                .builder()
                .user(user)
                .resetToken(token)
                .expirationTime(expirationTime)
                .used(false)
                .build();
    }
}
