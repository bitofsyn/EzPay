package com.example.ezpay.modules.auth.internal.service;

import com.example.ezpay.model.user.Notification;
import com.example.ezpay.model.user.TransferLimit;
import com.example.ezpay.model.user.User;
import com.example.ezpay.modules.auth.api.dto.*;
import com.example.ezpay.modules.user.api.facade.UserFacade;
import com.example.ezpay.repository.user.NotificationRepository;
import com.example.ezpay.repository.user.TransferLimitRepository;
import com.example.ezpay.repository.user.UserRepository;
import com.example.ezpay.shared.common.enums.NotificationType;
import com.example.ezpay.shared.common.enums.Status;
import com.example.ezpay.shared.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthenticationServiceImpl implements AuthenticationService {

    private final UserRepository userRepository;
    private final TransferLimitRepository transferLimitRepository;
    private final NotificationRepository notificationRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final UserFacade userFacade;

    @Override
    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        // 이메일 중복 체크
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("이미 등록된 이메일입니다.");
        }

        // 비밀번호 암호화
        String encodedPassword = passwordEncoder.encode(request.getPassword());

        // 사용자 생성
        User user = User.builder()
                .email(request.getEmail())
                .password(encodedPassword)
                .name(request.getName())
                .phoneNumber(request.getPhoneNumber())
                .status(Status.ACTIVE)
                .build();

        User savedUser = userRepository.save(user);

        // 기본 송금 한도 설정
        // TODO: Phase 4 이후 PaymentFacade.initializeTransferLimit()로 변경 예정
        TransferLimit transferLimit = TransferLimit.builder()
                .user(savedUser)
                .dailyLimit(new BigDecimal("1000000.00"))
                .perTransactionLimit(new BigDecimal("100000.00"))
                .build();
        transferLimitRepository.save(transferLimit);

        // 기본 알림 설정
        // TODO: Phase 4 이후 NotificationFacade.initializeNotificationSettings()로 변경 예정
        Notification emailNotification = Notification.builder()
                .user(savedUser)
                .notificationType(NotificationType.EMAIL)
                .isEnabled(true)
                .build();
        Notification pushNotification = Notification.builder()
                .user(savedUser)
                .notificationType(NotificationType.PUSH)
                .isEnabled(true)
                .build();
        notificationRepository.saveAll(Arrays.asList(emailNotification, pushNotification));

        return new RegisterResponse(
                savedUser.getUserId(),
                savedUser.getEmail(),
                savedUser.getName(),
                savedUser.getPhoneNumber()
        );
    }

    @Override
    @Transactional
    public LoginResponse login(LoginRequest request, String ipAddress, String deviceInfo) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());

        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("이메일 또는 비밀번호가 일치하지 않습니다.");
        }

        User user = userOpt.get();

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("이메일 또는 비밀번호가 일치하지 않습니다.");
        }

        // 로그인 기록 저장 (UserFacade를 통해)
        userFacade.recordLogin(user.getUserId(), ipAddress, deviceInfo);

        // JWT 토큰 생성
        String token = jwtUtil.generateToken(user);

        return new LoginResponse(
                token,
                user.getUserId(),
                user.getEmail(),
                user.getName()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public FindEmailResponse findEmail(FindEmailRequest request) {
        User user = userRepository.findByNameAndPhoneNumber(request.getName(), request.getPhoneNumber())
                .orElseThrow(() -> new IllegalArgumentException("일치하는 회원이 없습니다."));

        return new FindEmailResponse(user.getEmail());
    }
}
