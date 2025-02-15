package com.example.ezpay.controller.user;

import com.example.ezpay.model.user.User;
import com.example.ezpay.request.UserRequest;
import com.example.ezpay.response.CommonResponse;
import com.example.ezpay.service.user.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;


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

    // 전체 회원 조회
    @GetMapping
    public ResponseEntity<List<User>> getUsers() {
        List<User> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    // 특정 회원 조회
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        User user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    // 회원 수정
    @PutMapping("/{id}")
    public ResponseEntity<CommonResponse<User>> updateUser(@PathVariable Long id, @RequestBody UserRequest userRequest) {
        User user = userService.updateUser(id, userRequest);
        CommonResponse<User> response = new CommonResponse<>(
                "success", user, "User updated successfully"
        );
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    // 회원 탈퇴
    @DeleteMapping("/{id}")
    public ResponseEntity<CommonResponse> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        CommonResponse<String> response = new CommonResponse<>(
                "success", null, "User deleted successfully"
        );
        return ResponseEntity.ok(response);
    }

}
