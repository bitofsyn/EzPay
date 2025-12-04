package com.example.ezpay.controller.admin;

import com.example.ezpay.model.user.Transaction;
import com.example.ezpay.shared.common.dto.CommonResponse;
import com.example.ezpay.service.admin.AdminTransactionService;
import com.example.ezpay.service.user.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/transaction")
@RequiredArgsConstructor
public class AdminTransactionController {

    private final AdminTransactionService adminTransactionService;

    // 모든 거래 내역 조회
    @GetMapping("/all")
    public ResponseEntity<CommonResponse<List<Transaction>>> getAllTransactions() {
        List<Transaction> transactions = adminTransactionService.getAlltransactions();
        return ResponseEntity.ok(new CommonResponse<>("success", transactions, "모든 거래 내역 조회 성공 "));
    }

    // 특정 내역 삭제
    @DeleteMapping("/{transactionId}")
    public ResponseEntity<CommonResponse<String>> deleteTransaction(@PathVariable Long transactionId) {
        adminTransactionService.deleteTransaction(transactionId);
        return ResponseEntity.ok(new CommonResponse<>("success", "거래 삭제 완료", "TRANSACTION DELETED"));
    }

}
