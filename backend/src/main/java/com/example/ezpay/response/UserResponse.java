package com.example.ezpay.response;

import com.example.ezpay.model.user.User;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserResponse {
    private Long id;
    private String email;
    private String name;
    private String phoneNumber;

    public UserResponse(User user) {
        this.id = user.getUserId();
        this.email = user.getEmail();
        this.name = user.getName();
        this.phoneNumber = user.getPhoneNumber();
    }
}
