package com.example.ezpay.controller.admin;

import com.example.ezpay.modules.admin.internal.service.AdminService;
import com.example.ezpay.modules.user.api.dto.UserInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminUserController {
    private final AdminService adminService;

    // 전체 회원 조회
    @GetMapping
    public ResponseEntity<List<UserInfo>> getUsers() {
        List<UserInfo> users = adminService.getAllUsers();
        return ResponseEntity.ok(users);
    }
}
