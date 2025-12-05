package com.example.ezpay.modules.user.internal.service;

import com.example.ezpay.model.user.Accounts;
import com.example.ezpay.model.user.LoginHistory;
import com.example.ezpay.model.user.User;
import com.example.ezpay.modules.user.api.dto.LoginHistoryInfo;
import com.example.ezpay.modules.user.api.dto.UserInfo;
import com.example.ezpay.modules.user.api.dto.UserUpdateRequest;
import com.example.ezpay.repository.user.AccountRepository;
import com.example.ezpay.repository.user.LoginHistoryRepository;
import com.example.ezpay.repository.user.NotificationRepository;
import com.example.ezpay.repository.user.TransferLimitRepository;
import com.example.ezpay.repository.user.UserRepository;
import com.example.ezpay.shared.exception.CustomNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserManagementServiceImpl implements UserManagementService {

    private final UserRepository userRepository;
    private final LoginHistoryRepository loginHistoryRepository;
    private final TransferLimitRepository transferLimitRepository;
    private final NotificationRepository notificationRepository;
    private final AccountRepository accountRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public UserInfo getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomNotFoundException("사용자를 찾을 수 없습니다: " + userId));

        return convertToUserInfo(user);
    }

    @Override
    @Transactional(readOnly = true)
    public UserInfo getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomNotFoundException("사용자를 찾을 수 없습니다: " + email));

        return convertToUserInfo(user);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsById(Long userId) {
        return userRepository.existsById(userId);
    }

    @Override
    @Transactional
    public UserInfo updateUser(Long userId, UserUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomNotFoundException("사용자를 찾을 수 없습니다: " + userId));

        if (request.getName() != null) {
            user.setName(request.getName());
        }
        if (request.getEmail() != null) {
            user.setEmail(request.getEmail());
        }
        if (request.getPassword() != null) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        User updatedUser = userRepository.save(user);
        return convertToUserInfo(updatedUser);
    }

    @Override
    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomNotFoundException("사용자를 찾을 수 없습니다: " + userId));

        // 연관 데이터 삭제
        transferLimitRepository.deleteByUser_UserId(user.getUserId());
        notificationRepository.deleteByUser(user);

        List<Accounts> accounts = accountRepository.findByUser(user);
        for (Accounts account : accounts) {
            transferLimitRepository.deleteById(account.getAccountId());
            accountRepository.delete(account);
        }

        loginHistoryRepository.deleteByUser_UserId(user.getUserId());
        userRepository.deleteById(userId);
    }

    @Override
    @Transactional
    public void recordLogin(Long userId, String ipAddress, String deviceInfo) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomNotFoundException("사용자를 찾을 수 없습니다: " + userId));

        LoginHistory loginHistory = LoginHistory.builder()
                .user(user)
                .ip(ipAddress)
                .device(deviceInfo)
                .build();

        loginHistoryRepository.save(loginHistory);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LoginHistoryInfo> getRecentLoginHistory(Long userId, int limit) {
        List<LoginHistory> histories;

        if (limit == 10) {
            histories = loginHistoryRepository.findTop10ByUser_UserIdOrderByTimestampDesc(userId);
        } else {
            // 다른 limit 값에 대한 처리 (필요시 추가 구현)
            histories = loginHistoryRepository.findTop10ByUser_UserIdOrderByTimestampDesc(userId);
        }

        return histories.stream()
                .map(this::convertToLoginHistoryInfo)
                .collect(Collectors.toList());
    }

    /**
     * User 엔티티를 UserInfo DTO로 변환
     */
    private UserInfo convertToUserInfo(User user) {
        return UserInfo.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .name(user.getName())
                .phone(user.getPhoneNumber())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toLocalDateTime() : null)
                .build();
    }

    /**
     * LoginHistory 엔티티를 LoginHistoryInfo DTO로 변환
     */
    private LoginHistoryInfo convertToLoginHistoryInfo(LoginHistory history) {
        return LoginHistoryInfo.builder()
                .historyId(history.getId())
                .userId(history.getUser().getUserId())
                .ipAddress(history.getIp())
                .deviceInfo(history.getDevice())
                .loginTime(history.getTimestamp() != null ? history.getTimestamp().toLocalDateTime() : null)
                .build();
    }
}
