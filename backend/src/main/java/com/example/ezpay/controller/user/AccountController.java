package com.example.ezpay.controller.user;

import com.example.ezpay.model.user.Accounts;
import com.example.ezpay.modules.account.api.dto.AccountCreateRequest;
import com.example.ezpay.modules.account.api.dto.AccountResponse;
import com.example.ezpay.modules.account.internal.service.AccountService;
import com.example.ezpay.modules.payment.api.dto.AccountOwnerInfo;
import com.example.ezpay.modules.payment.internal.service.TransactionService;
import com.example.ezpay.shared.common.dto.CommonResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/account")
public class AccountController {
    private final AccountService accountService;
    private final TransactionService transactionService;

    public AccountController(AccountService accountService, TransactionService transactionService) {
        this.accountService = accountService;
        this.transactionService = transactionService;
    }

    // 계좌등록
    @PostMapping
    public ResponseEntity<CommonResponse<AccountResponse>> createAccount(@Valid @RequestBody AccountCreateRequest accountRequest) {
        Accounts accounts = accountService.createAccount(accountRequest);
        return ResponseEntity.ok(new CommonResponse<>("success", new AccountResponse(accounts), "Account created"));
    }

    // 모든 계좌 조회
    @GetMapping
    public ResponseEntity<CommonResponse<List<AccountResponse>>> getAllAccounts() {
        List<AccountResponse> accounts = accountService.getAllAccounts().stream()
                .map(AccountResponse::new)
                .toList();
        return ResponseEntity.ok(new CommonResponse<>("success", accounts, "조회 성공"));
    }

    // 특정 사용자의 모든 계좌 조회
    @GetMapping("/me")
    public ResponseEntity<CommonResponse<List<AccountResponse>>> getUserAccounts(Authentication authentication) {
        List<AccountResponse> accounts = accountService.getMyAccounts(authentication).stream()
                .map(AccountResponse::new)
                .toList();
        return ResponseEntity.ok(new CommonResponse<>("success", accounts, "조회 성공"));
    }

    // 계좌번호로 사용자 확인하기
    @GetMapping("/{accountNumber}")
    public ResponseEntity<CommonResponse<AccountOwnerInfo>> getAccountOwner(@PathVariable String accountNumber) {
        AccountOwnerInfo response = transactionService.getOwnerNameByAccountNumber(accountNumber);
        return ResponseEntity.ok(new CommonResponse<>("success", response, "계좌 소유주 조회 성공"));
    }

    // 계좌 잔액 수정
    @PutMapping("/{accountId}")
    public ResponseEntity<CommonResponse<AccountResponse>> updateBalance(@PathVariable Long accountId , @RequestParam BigDecimal balance) {
        Accounts accounts = accountService.updateBalance(accountId, balance);
        return ResponseEntity.ok(new CommonResponse<>("success", new AccountResponse(accounts), "Balance updated"));
    }

    // 계좌 삭제
    @DeleteMapping("/{accountId}")
    public ResponseEntity<CommonResponse<String>> deleteAccount(@PathVariable Long accountId) {
        accountService.deleteAccount(accountId);
        return ResponseEntity.ok(new CommonResponse<>("success", "Account deleted", "DELETE SUCCESS"));
    }

    // 대표계좌 설정
    @PatchMapping("/{accountId}/main")
    public ResponseEntity<CommonResponse<String>> setMainAccount(Authentication authentication,
                                                                 @PathVariable Long accountId) {
        accountService.setMainAccount(authentication.getName(), accountId);
        return ResponseEntity.ok(new CommonResponse<>("success", null, "대표 계좌 설정 완료"));
    }
}
