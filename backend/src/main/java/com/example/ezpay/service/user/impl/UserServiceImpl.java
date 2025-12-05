package com.example.ezpay.service.user.impl;

import com.example.ezpay.shared.exception.CustomNotFoundException;
import com.example.ezpay.model.user.*;
import com.example.ezpay.repository.user.*;
import com.example.ezpay.request.UserRequest;
import com.example.ezpay.response.UserResponse;
import com.example.ezpay.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;
    private final TransferLimitRepository transferLimitRepository;
    private final NotificationRepository notificationRepository;
    private final LoginHistoryRepository loginHistoryRepository;
    private final AccountRepository accountRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    // 사용자 정보 조회
    @Override
    public UserResponse getUserInfo(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomNotFoundException(email));

        return new UserResponse(user);
    }

    // 특정 회원 조회
    @Override
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new CustomNotFoundException("사용자를 찾을 수 없습니다." + id));
    }

    // 정보 수정
    @Override
    public User updateUser(Long id, UserRequest userRequest) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new CustomNotFoundException("사용자를 찾을 수 없습니다." + id));

        if(userRequest.getName() != null) user.setName(userRequest.getName());
        if(userRequest.getEmail() != null) user.setEmail(userRequest.getEmail());
        if(userRequest.getPassword() != null) user.setPassword(passwordEncoder.encode(userRequest.getPassword()));

        return userRepository.save(user);
    }

    // 정보 삭제
    @Transactional
    @Override
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new CustomNotFoundException("사용자를 찾을 수 없습니다." + id));

        transferLimitRepository.deleteByUser_UserId(user.getUserId());
        notificationRepository.deleteByUser(user);
        List<Accounts> accounts = accountRepository.findByUser(user);
        for(Accounts account: accounts) {
            transferLimitRepository.deleteById(account.getAccountId());
            accountRepository.delete(account);
        }
        loginHistoryRepository.deleteByUser_UserId(user.getUserId());
        userRepository.deleteById(id);
    }

    // 로그인 기록 조회
    @Override
    public List<LoginHistory> getRecentLoginHistory(Long userId) {
        return loginHistoryRepository.findTop10ByUser_UserIdOrderByTimestampDesc(userId);
    }
}
