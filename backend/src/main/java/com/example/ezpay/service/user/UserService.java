package com.example.ezpay.service.user;


import com.example.ezpay.model.user.LoginHistory;
import com.example.ezpay.model.user.User;
import com.example.ezpay.request.FindEmailRequest;
import com.example.ezpay.request.LoginRequest;
import com.example.ezpay.request.UserRequest;
import com.example.ezpay.response.UserResponse;

import java.util.List;
import java.util.Optional;

public interface UserService {
    User registerUser(UserRequest userRequest);
    String login(LoginRequest loginRequest, String ip, String device);
    UserResponse getUserInfo(String email);

    User getUserById(Long id);
    User updateUser(Long id, UserRequest userRequest);
    void deleteUser(Long id);

    // 로그인 기록 조회
    List<LoginHistory> getRecentLoginHistory(Long userId);

    // 이메일 찾기
    String findByEmail(FindEmailRequest request);
}
