package com.example.ezpay.service.user;

import com.example.ezpay.model.user.User;
import com.example.ezpay.repository.user.UserRepository;
import com.example.ezpay.request.UserRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

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

        // 사용자 저장
        return userRepository.save(user);
    }
}
