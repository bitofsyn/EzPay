package com.example.ezpay.controller.admin;

import com.example.ezpay.model.user.TransferLimit;
import com.example.ezpay.request.TransferLimitRequest;
import com.example.ezpay.response.CommonResponse;
import com.example.ezpay.service.user.TransferLimitService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/transfer-limits")
@RequiredArgsConstructor
public class AdminTransferLimitController {
    private final TransferLimitService transferLimitService;

    // 모든 사용자 송금 한도 조회
    @GetMapping("/all")
    public ResponseEntity<CommonResponse<List<TransferLimit>>> getAllTransferLimits() {
        List<TransferLimit> transferLimits = transferLimitService.getAllTransferLimits();
        return ResponseEntity.ok(new CommonResponse<>("success", transferLimits, "모든 송금 한도 조회 성공"));
    }

    // 특정 사용자 송금 한도 수정
    @PutMapping("/{userId}")
    public ResponseEntity<CommonResponse<String>> updateUserTransferLimit(@PathVariable Long userId,
                                                                          @RequestBody TransferLimitRequest transferLimitRequest) {
        transferLimitService.updateUserTransferLimit(userId, transferLimitRequest);
        return ResponseEntity.ok(new CommonResponse<>("success", "사용자 송금 한도 수정 완료", "USER TRANSFER LIMIT UPDATED"));
    }

    // 특정 사용자 송금 한도 초기화
    @PutMapping("/reset/{userId}")
    public ResponseEntity<CommonResponse<String>> resetUserTransferLimit(@PathVariable Long userId) {
        transferLimitService.resetUserTransferLimit(userId);
        return ResponseEntity.ok(new CommonResponse<>("success", "송금 한도 초기화 완료", "TRANSFER LIMIT RESET"));
    }
}
