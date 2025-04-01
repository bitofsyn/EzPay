package com.example.ezpay.service.admin.Impl;

import com.example.ezpay.model.user.User;
import com.example.ezpay.repository.user.UserRepository;
import com.example.ezpay.service.admin.AdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminUserServiceImpl implements AdminUserService {
    private UserRepository userRepository;
    // 전체 회원 조회
    @Override
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
}
