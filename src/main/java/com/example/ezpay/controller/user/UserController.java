package com.example.ezpay.controller.user;

import com.example.ezpay.model.user.User;
import com.example.ezpay.request.UserRequest;
import com.example.ezpay.response.CommonResponse;
import com.example.ezpay.service.user.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // 회원 등록
    @PostMapping
    public ResponseEntity<CommonResponse<User>> createUser(@RequestBody UserRequest userRequest) {
        User user = userService.registerUser(userRequest);
        CommonResponse<User> response = new CommonResponse<>(
                "success", user, "User created successfully"
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // 회원 수정
    // 회원 탈퇴

}
