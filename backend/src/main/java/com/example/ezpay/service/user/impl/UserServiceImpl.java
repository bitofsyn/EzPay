package com.example.ezpay.service.user.impl;

import com.example.ezpay.exception.CustomNotFoundException;
import com.example.ezpay.model.enums.NotificationType;
import com.example.ezpay.model.user.LoginHistory;
import com.example.ezpay.model.user.Notification;
import com.example.ezpay.model.user.TransferLimit;
import com.example.ezpay.model.user.User;
import com.example.ezpay.repository.user.LoginHistoryRepository;
import com.example.ezpay.repository.user.NotificationRepository;
import com.example.ezpay.repository.user.TransferLimitRepository;
import com.example.ezpay.repository.user.UserRepository;
import com.example.ezpay.request.LoginRequest;
import com.example.ezpay.request.UserRequest;
import com.example.ezpay.response.UserResponse;
import com.example.ezpay.security.JwtUtil;
import com.example.ezpay.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;
    private final TransferLimitRepository transferLimitRepository;
    private final NotificationRepository notificationRepository;
    private final LoginHistoryRepository loginHistoryRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    // 회원 가입
    @Transactional
    public User registerUser(UserRequest userRequest) {
        // 이메일 중복 체크
        if(userRepository.existsByEmail(userRequest.getEmail())) {
            throw new IllegalArgumentException("이미 등록된 이메일입니다.");
        }

        // 비밀번호 암호화
        String encodedPassword = passwordEncoder.encode(userRequest.getPassword());

        // 사용자 생성
        User user = userRequest.toEntity(encodedPassword);
        User savedUser = userRepository.save(user);

        // 기본 송금 한도 자동 추가
        TransferLimit transferLimit = TransferLimit
                .builder()
                .user(savedUser)
                .dailyLimit(new BigDecimal("1000000.00"))
                .perTransactionLimit(new BigDecimal("100000.00"))
                .build();
        transferLimitRepository.save(transferLimit);

        // 기본 알림 설정 자동 등록
        List<Notification> defaultNotifications = Arrays.asList(
                Notification.builder().user(user).notificationType(NotificationType.EMAIL).isEnabled(true).build(),
                Notification.builder().user(user).notificationType(NotificationType.PUSH).isEnabled(true).build()
        );
        notificationRepository.saveAll(defaultNotifications);

        // 사용자 저장
        return savedUser;
    }

    // 로그인
    @Override
    public String login(LoginRequest loginRequest, String ip, String device) {
        Optional<User> userOpt = userRepository.findByEmail(loginRequest.getEmail());

        if(userOpt.isPresent()) {
            User user = userOpt.get();

            if(passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
                // 로그인 기록 저장
                LoginHistory loginHistory = LoginHistory.builder()
                        .user(user)
                        .ip(ip)              // 라이언트에서 전달받은 IP
                        .device(device)      // 클라이언트에서 전달받은 기기 정보
                        .build();
                loginHistoryRepository.save(loginHistory);

                return jwtUtil.generateToken(user);
            }
        }
        return null;
    }

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
    @Override
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new CustomNotFoundException("사용자를 찾을 수 없습니다." + id));
        userRepository.deleteById(id);
    }

    // 로그인 기록 조회
    @Override
    public List<LoginHistory> getRecentLoginHistory(Long userId) {
        return loginHistoryRepository.findTop10ByUser_UserIdOrderByTimestampDesc(userId);
    }
}
