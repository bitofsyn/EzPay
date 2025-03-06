package com.example.ezpay.service.user;


import com.example.ezpay.model.user.User;
import com.example.ezpay.request.UserRequest;

import java.util.List;

public interface UserService {
    User registerUser(UserRequest userRequest);
    List<User> getAllUsers();
    User getUserById(Long id);
    User updateUser(Long id, UserRequest userRequest);
    void deleteUser(Long id);
}
