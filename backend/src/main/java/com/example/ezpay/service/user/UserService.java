package com.example.ezpay.service.user;


import com.example.ezpay.model.user.User;
import com.example.ezpay.request.LoginRequest;
import com.example.ezpay.request.UserRequest;

import java.util.List;

public interface UserService {
    User registerUser(UserRequest userRequest);
    String login(LoginRequest loginRequest);
    List<User> getAllUsers();
    User getUserById(Long id);
    User updateUser(Long id, UserRequest userRequest);
    void deleteUser(Long id);
}
