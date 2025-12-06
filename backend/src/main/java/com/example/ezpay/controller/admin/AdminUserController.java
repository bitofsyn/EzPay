package com.example.ezpay.controller.admin;

import com.example.ezpay.modules.account.api.dto.AccountInfo;
import com.example.ezpay.modules.admin.internal.service.AdminService;
import com.example.ezpay.modules.payment.api.dto.TransactionInfo;
import com.example.ezpay.modules.user.api.dto.UserInfo;
import com.example.ezpay.shared.common.dto.CommonResponse;
import com.example.ezpay.shared.common.enums.Status;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
public class AdminUserController {
    private final AdminService adminService;

    // 전체 회원 조회
    @GetMapping
    public ResponseEntity<CommonResponse<List<UserInfo>>> getAllUsers() {
        List<UserInfo> users = adminService.getAllUsers();
        return ResponseEntity.ok(new CommonResponse<>("success", users, "전체 회원 조회 성공"));
    }

    // 특정 회원 상세 조회
    @GetMapping("/{userId}")
    public ResponseEntity<CommonResponse<UserInfo>> getUserById(@PathVariable Long userId) {
        UserInfo user = adminService.getUserById(userId);
        return ResponseEntity.ok(new CommonResponse<>("success", user, "회원 상세 조회 성공"));
    }

    // 특정 회원의 계좌 조회
    @GetMapping("/{userId}/accounts")
    public ResponseEntity<CommonResponse<List<AccountInfo>>> getUserAccounts(@PathVariable Long userId) {
        List<AccountInfo> accounts = adminService.getUserAccounts(userId);
        return ResponseEntity.ok(new CommonResponse<>("success", accounts, "회원 계좌 조회 성공"));
    }

    // 특정 회원의 거래 내역 조회
    @GetMapping("/{userId}/transactions")
    public ResponseEntity<CommonResponse<List<TransactionInfo>>> getUserTransactions(@PathVariable Long userId) {
        List<TransactionInfo> transactions = adminService.getUserTransactions(userId);
        return ResponseEntity.ok(new CommonResponse<>("success", transactions, "회원 거래 내역 조회 성공"));
    }

    // 회원 상태 변경
    @PatchMapping("/{userId}/status")
    public ResponseEntity<CommonResponse<String>> updateUserStatus(
            @PathVariable Long userId,
            @RequestParam Status status) {
        adminService.updateUserStatus(userId, status);
        return ResponseEntity.ok(new CommonResponse<>("success", "회원 상태 변경 완료", "USER STATUS UPDATED"));
    }

    // 회원 삭제
    @DeleteMapping("/{userId}")
    public ResponseEntity<CommonResponse<String>> deleteUser(@PathVariable Long userId) {
        adminService.deleteUser(userId);
        return ResponseEntity.ok(new CommonResponse<>("success", "회원 삭제 완료", "USER DELETED"));
    }
}
