package com.example.ezpay.controller.user;

import com.example.ezpay.modules.user.api.dto.LoginHistoryInfo;
import com.example.ezpay.modules.user.api.dto.UserInfo;
import com.example.ezpay.modules.user.api.dto.UserUpdateRequest;
import com.example.ezpay.modules.user.api.facade.UserFacade;
import com.example.ezpay.shared.common.dto.CommonResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/users")
public class UserController {

    private final UserFacade userFacade;

    public UserController(UserFacade userFacade) {
        this.userFacade = userFacade;
    }

    // 사용자 정보
    @GetMapping("/me")
    public ResponseEntity<CommonResponse<UserInfo>> getMyInfo(Authentication authentication) {
        if(authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new CommonResponse<>("error", null, "Authentication is null"));
        }

        // JWT에서 저장된 값(현재email)
        String email = ((UserDetails) authentication.getPrincipal()).getUsername();
        UserInfo userInfo = userFacade.getUserByEmail(email);

        return ResponseEntity.ok(new CommonResponse<>("success", userInfo, "사용자 정보 조회 성공 "));
    }

    // 특정 회원 조회
    @GetMapping("/{id}")
    public ResponseEntity<UserInfo> getUserById(@PathVariable Long id) {
        UserInfo userInfo = userFacade.getUserById(id);
        return ResponseEntity.ok(userInfo);
    }

    // 회원 수정
    @PutMapping("/{id}")
    public ResponseEntity<CommonResponse<UserInfo>> updateUser(@PathVariable Long id, @RequestBody UserUpdateRequest request) {
        UserInfo userInfo = userFacade.updateUser(id, request);
        CommonResponse<UserInfo> response = new CommonResponse<>(
                "success", userInfo, "User updated successfully"
        );
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    // 회원 탈퇴
    @DeleteMapping("/{id}")
    public ResponseEntity<CommonResponse<String>> deleteUser(@PathVariable Long id) {
        userFacade.deleteUser(id);
        CommonResponse<String> response = new CommonResponse<>(
                "success", null, "User deleted successfully"
        );
        return ResponseEntity.ok(response);
    }

    // 로그인 기록 조회
    @GetMapping("/{id}/login-history")
    public ResponseEntity<CommonResponse<List<LoginHistoryInfo>>> getLoginHistory(@PathVariable Long id) {
        List<LoginHistoryInfo> history = userFacade.getRecentLoginHistory(id, 10);
        return ResponseEntity.ok(new CommonResponse<>("success", history, "최근 로그인 기록 조회 성공"));
    }
}
