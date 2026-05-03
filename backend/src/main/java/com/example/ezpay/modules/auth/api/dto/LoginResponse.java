package com.example.ezpay.modules.auth.api.dto;

import com.example.ezpay.shared.common.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private Long userId;
    private String email;
    private String name;
    private Role role;
}
