package com.example.ezpay.controller.user;

import com.example.ezpay.model.user.Users;
import com.example.ezpay.repository.user.UserRepository;
import com.example.ezpay.service.user.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import java.util.List;

@RestController
@RequestMapping("/users")
public class UserController {
    @Autowired
    private UserService userService;

    @PostMapping
    public ResponseEntity<Users> createUser(@RequestBody Users user) {
        System.out.println("===================== user: " + user.toString() + "==================");
        Users saveUser = userService.saveUser(user);
        System.out.println("===================== 성공? " + saveUser.toString() + "==================");
        return ResponseEntity.ok(saveUser);
    }
}
