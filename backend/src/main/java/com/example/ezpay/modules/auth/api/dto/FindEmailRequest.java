package com.example.ezpay.modules.auth.api.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FindEmailRequest {
    private String name;
    private String phoneNumber;
}
