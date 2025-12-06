package com.example.ezpay.controller.admin;

import com.example.ezpay.modules.admin.internal.service.AdminService;
import com.example.ezpay.modules.payment.api.dto.TransactionInfo;
import com.example.ezpay.shared.common.dto.CommonResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/transaction")
@RequiredArgsConstructor
public class AdminTransactionController {

    private final AdminService adminService;

    // 모든 거래 내역 조회
    @GetMapping("/all")
    public ResponseEntity<CommonResponse<List<TransactionInfo>>> getAllTransactions() {
        List<TransactionInfo> transactions = adminService.getAllTransactions();
        return ResponseEntity.ok(new CommonResponse<>("success", transactions, "모든 거래 내역 조회 성공 "));
    }

    // 특정 내역 삭제
    @DeleteMapping("/{transactionId}")
    public ResponseEntity<CommonResponse<String>> deleteTransaction(@PathVariable Long transactionId) {
        adminService.deleteTransaction(transactionId);
        return ResponseEntity.ok(new CommonResponse<>("success", "거래 삭제 완료", "TRANSACTION DELETED"));
    }

}
