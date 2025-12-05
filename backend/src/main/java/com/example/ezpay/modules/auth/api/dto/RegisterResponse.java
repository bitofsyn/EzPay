package com.example.ezpay.modules.auth.api.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class RegisterResponse {
    private Long userId;
    private String email;
    private String name;
    private String phoneNumber;
}
