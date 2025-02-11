package com.example.ezpay.service.user;

import com.example.ezpay.model.user.Users;
import com.example.ezpay.repository.user.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public Users saveUser(Users user) {
        try {
            Users savedUser = userRepository.save(user);
            userRepository.flush();
            return savedUser;
        }catch (Exception e) {
            throw e;
        }
    }
}
