package com.example.ezpay.service.user;


import com.example.ezpay.model.user.LoginHistory;
import com.example.ezpay.model.user.User;
import com.example.ezpay.request.UserRequest;
import com.example.ezpay.response.UserResponse;

import java.util.List;

public interface UserService {
    UserResponse getUserInfo(String email);

    User getUserById(Long id);
    User updateUser(Long id, UserRequest userRequest);
    void deleteUser(Long id);

    // 로그인 기록 조회
    List<LoginHistory> getRecentLoginHistory(Long userId);
}
