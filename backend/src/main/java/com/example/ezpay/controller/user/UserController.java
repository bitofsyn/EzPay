package com.example.ezpay.controller.user;

import com.example.ezpay.model.user.LoginHistory;
import com.example.ezpay.model.user.User;
import com.example.ezpay.request.UserRequest;
import com.example.ezpay.shared.common.dto.CommonResponse;
import com.example.ezpay.response.LoginHistoryResponse;
import com.example.ezpay.response.UserResponse;
import com.example.ezpay.service.user.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // 사용자 정보
    @GetMapping("/me")
    public ResponseEntity<CommonResponse<UserResponse>> getMyInfo(Authentication authentication) {
        if(authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new CommonResponse<>("error", null, "Authentication is null"));
        }

        // JWT에서 저장된 값(현재email)
        String email = ((UserDetails) authentication.getPrincipal()).getUsername();
        UserResponse response = userService.getUserInfo(email);

        return ResponseEntity.ok(new CommonResponse<>("success", response, "사용자 정보 조회 성공 "));
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
    public ResponseEntity<CommonResponse<String>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        CommonResponse<String> response = new CommonResponse<>(
                "success", null, "User deleted successfully"
        );
        return ResponseEntity.ok(response);
    }

    // 로그인 기록 조회
    @GetMapping("/{id}/login-history")
    public ResponseEntity<CommonResponse<List<LoginHistoryResponse>>> getLoginHistory(@PathVariable Long id) {
        List<LoginHistory> history = userService.getRecentLoginHistory(id);
        List<LoginHistoryResponse> responses = history.stream()
                .map(LoginHistoryResponse::from)
                .toList();
        return ResponseEntity.ok(new CommonResponse<>("success", responses, "최근 로그인 기록 조회 성공"));
    }
}
