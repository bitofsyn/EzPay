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
        System.out.println("힘들다 ");
        try {
            System.out.println("here===============");
            Users savedUser = userRepository.save(user);
            userRepository.flush();
            System.out.println("Successfully saved user: " + savedUser + " ============ ");
            return savedUser;
        }catch (Exception e) {
            System.out.println("Error while saving user: " + e.getMessage() + "============");
            throw e;
        }
    }
}
