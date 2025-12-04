package com.example.ezpay.request;


import com.example.ezpay.shared.common.enums.Status;
import com.example.ezpay.model.user.User;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserRequest {
    private String email;
    private String password;
    private String name;
    private String phoneNumber;

    public User toEntity(String encodedPassword) {
        return User.builder()
                .name(this.name)
                .email(this.email)
                .phoneNumber(this.phoneNumber)
                .password(encodedPassword)
                .status(Status.ACTIVE)
                .build();
    }
}
