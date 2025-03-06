package com.example.ezpay.request;


import com.example.ezpay.model.enums.Status;
import com.example.ezpay.model.user.User;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserRequest {
    private String email;
    private String password;
    private String name;

    public User toEntity(String encodedPassword) {
        return User.builder()
                .name(this.name)
                .email(this.email)
                .password(encodedPassword)
                .status(Status.ACTIVE)
                .build();
    }
}
