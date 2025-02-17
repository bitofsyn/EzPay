package com.example.ezpay.controller.user;

import com.example.ezpay.model.user.Accounts;
import com.example.ezpay.request.AccountRequest;
import com.example.ezpay.response.CommonResponse;
import com.example.ezpay.service.user.AccountService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/account")
public class AccountController {
    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    // 계좌등록
    @PostMapping
    public ResponseEntity<CommonResponse<Accounts>> createAccount(@RequestBody AccountRequest accountRequest) {
        Accounts accounts = accountService.createAccount(accountRequest);
        return ResponseEntity.ok(new CommonResponse<>("success", accounts, "Account created"));
    }

    // 모든 계좌 조회
    @GetMapping
    public ResponseEntity<CommonResponse<List<Accounts>>> getAllAccounts() {
        return ResponseEntity.ok(new CommonResponse<>("success", accountService.getAllAccounts(), "조회 성공"));
    }


    // 특정 사용자의 모든 계좌 조회
    @GetMapping("/{userId}")
    public ResponseEntity<CommonResponse<List<Accounts>>> getUserAccounts(@PathVariable Long userId) {
        List<Accounts> accounts = accountService.getAccountByUserId(userId);
        return ResponseEntity.ok(new CommonResponse<>("success", accounts, "조회 성공"));
    }

    // 계좌 잔액 수정
    @PutMapping("/{accountId}")
    public ResponseEntity<CommonResponse<Accounts>> updateBalance(@PathVariable Long accountId , @RequestParam BigDecimal balance) {
        Accounts accounts = accountService.updateBalance(accountId, balance);
        return ResponseEntity.ok(new CommonResponse<>("success", accounts, "Balance updated"));
    }

    // 계좌 삭제
    @DeleteMapping("/{accountId}")
    public ResponseEntity<CommonResponse<String>> deleteAccount(@PathVariable Long accountId) {
        accountService.deleteAccount(accountId);
        return ResponseEntity.ok(new CommonResponse<>("success", "Account deleted", "DELETE SUCCESS"));
    }
}
