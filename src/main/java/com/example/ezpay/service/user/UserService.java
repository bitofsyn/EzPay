package com.example.ezpay.service.user;


import com.example.ezpay.model.user.User;
import com.example.ezpay.request.UserRequest;

public interface UserService {
    User registerUser(UserRequest userRequest);
}
