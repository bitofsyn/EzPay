package com.example.ezpay.controller.admin;

import com.example.ezpay.model.user.TransferLimit;
import com.example.ezpay.request.TransferLimitRequest;
import com.example.ezpay.response.CommonResponse;
import com.example.ezpay.service.admin.AdminTransferLimitService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/transfer-limit")
@RequiredArgsConstructor
public class AdminTransferLimitController {
    private final AdminTransferLimitService adminTransferLimitService;

    // 모든 사용자 송금 한도 조회
    @GetMapping("/all")
    public ResponseEntity<CommonResponse<List<TransferLimit>>> getAllTransferLimits() {
        List<TransferLimit> transferLimits = adminTransferLimitService.getAllTransferLimits();
        return ResponseEntity.ok(new CommonResponse<>("success", transferLimits, "모든 송금 한도 조회 성공"));
    }

    // 특정 사용자 송금 한도 수정
    @PutMapping("/{userId}")
    public ResponseEntity<CommonResponse<String>> updateUserTransferLimit(@RequestBody TransferLimitRequest transferLimitRequest) {
        adminTransferLimitService.updateUserTransferLimit(transferLimitRequest);
        return ResponseEntity.ok(new CommonResponse<>("success", "사용자 송금 한도 수정 완료", "USER TRANSFER LIMIT UPDATED"));
    }

    // 특정 사용자 송금 한도 삭제
    @DeleteMapping("/{userId}")
    public ResponseEntity<CommonResponse<String>> deleteUserTransferLimit(@PathVariable Long userId) {
        adminTransferLimitService.deleteUserTransferLimit(userId);
        return ResponseEntity.ok(new CommonResponse<>("success", "송금 한도 삭제 완료", "TRANSFER LIMIT DELETED"));
    }
}
