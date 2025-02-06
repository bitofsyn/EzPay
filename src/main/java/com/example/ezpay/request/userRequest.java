package com.example.ezpay.request;

import com.example.ezpay.model.user.Users;
import lombok.Getter;

@Getter
public class userRequest {
    private String email;
    private String password;
    private String name;
}
