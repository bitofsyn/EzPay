package com.example.ezpay.controller.user;

import com.example.ezpay.shared.exception.CustomNotFoundException;
import com.example.ezpay.shared.exception.TransferLimitExceededException;
import com.example.ezpay.model.user.Transaction;
import com.example.ezpay.modules.payment.internal.service.TransactionService;
import com.example.ezpay.request.TransferRequest;
import com.example.ezpay.shared.common.dto.CommonResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/transaction")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class TransactionController {
    private final TransactionService transactionService;

    // 송금 요청
    @PostMapping("/transfer")
    public ResponseEntity<CommonResponse<String>> transfer(@RequestBody TransferRequest transferRequest) {
        try {
            String requestId = transactionService.transferMoney(transferRequest);
            return ResponseEntity.status(HttpStatus.ACCEPTED)
                    .body(new CommonResponse<>("success", requestId, "TRANSFER_ACCEPTED"));
        } catch (IllegalArgumentException | CustomNotFoundException | TransferLimitExceededException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new CommonResponse<>("error", null, e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new CommonResponse<>("error", null, "서버 오류 발생"));
        }
    }

    // 송금 처리 상태 조회 (비동기 처리용)
    @GetMapping("/transfer/{requestId}")
    public ResponseEntity<CommonResponse<Transaction>> getTransferByRequestId(@PathVariable String requestId) {
        Transaction transaction = transactionService.getTransactionByRequestId(requestId);
        return ResponseEntity.ok(new CommonResponse<>("success", transaction, "송금 조회 성공"));
    }


    // 특정 계좌의 거래 내역 조회
    @GetMapping("/account/{accountId}")
    public ResponseEntity<CommonResponse<List<Transaction>>> getTransactionsByAccount(@PathVariable Long accountId) {
        List<Transaction> transactions = transactionService.getTransactionByAccount(accountId);
        return ResponseEntity.ok(new CommonResponse<>("success", transactions, "거래 내역 조회 성공"));
    }

    // 특정 거래 ID로 상세 조회
    @GetMapping("/{transactionId}")
    public ResponseEntity<CommonResponse<Transaction>> getTransactionById(@PathVariable Long transactionId) {
        Transaction transaction = transactionService.getTransactionById(transactionId);
        return ResponseEntity.ok(new CommonResponse<>("success", transaction, "거래 상세 조회 성공"));
    }

    // 거래 취소 요청
    @PutMapping("/cancel/{transactionId}")
    public ResponseEntity<CommonResponse<String>> cancelTransaction(@PathVariable Long transactionId,
                                                                    @RequestParam Long userId) { // userId 추가
        Transaction transaction = transactionService.getTransactionById(transactionId);

        if (!transaction.getSenderAccount().getUser().getUserId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new CommonResponse<>("fail", "본인의 거래만 취소할 수 있습니다.", "FORBIDDEN"));
        }

        transactionService.cancelTransaction(transactionId);
        return ResponseEntity.ok(new CommonResponse<>("success", "거래 취소 완료", "TRANSACTION CANCELLED"));
    }

    // 사용자가 송금한 거래 내역 조회
    @GetMapping("/sent/{accountId}")
    public ResponseEntity<CommonResponse<List<Transaction>>> getSentTransactions(@PathVariable Long accountId) {
        List<Transaction> transactions = transactionService.getSentTransactions(accountId);
        return ResponseEntity.ok(new CommonResponse<>("success", transactions, "송금한 거래 내역 조회 성공"));
    }

    // 사용자가 받은 거래 내역 조회
    @GetMapping("/received/{accountId}")
    public ResponseEntity<CommonResponse<List<Transaction>>> getReceivedTransactions(@PathVariable Long accountId) {
        List<Transaction> transactions = transactionService.getReceivedTransactions(accountId);
        return ResponseEntity.ok(new CommonResponse<>("success", transactions, "입금된 거래 내역 조회 성공"));
    }


}
