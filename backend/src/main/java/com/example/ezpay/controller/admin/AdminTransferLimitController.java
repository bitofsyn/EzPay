package com.example.ezpay.controller.admin;

import com.example.ezpay.modules.admin.internal.service.AdminService;
import com.example.ezpay.modules.payment.api.dto.TransferLimitInfo;
import com.example.ezpay.request.TransferLimitRequest;
import com.example.ezpay.shared.common.dto.CommonResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/transfer-limits")
@RequiredArgsConstructor
public class AdminTransferLimitController {
    private final AdminService adminService;

    // 모든 사용자 송금 한도 조회
    @GetMapping("/all")
    public ResponseEntity<CommonResponse<List<TransferLimitInfo>>> getAllTransferLimits() {
        List<TransferLimitInfo> transferLimits = adminService.getAllTransferLimits();
        return ResponseEntity.ok(new CommonResponse<>("success", transferLimits, "모든 송금 한도 조회 성공"));
    }

    // 특정 사용자 송금 한도 수정
    @PutMapping("/{userId}")
    public ResponseEntity<CommonResponse<String>> updateUserTransferLimit(@PathVariable Long userId,
                                                                          @RequestBody TransferLimitRequest transferLimitRequest) {
        adminService.updateUserTransferLimit(userId, transferLimitRequest);
        return ResponseEntity.ok(new CommonResponse<>("success", "사용자 송금 한도 수정 완료", "USER TRANSFER LIMIT UPDATED"));
    }

    // 특정 사용자 송금 한도 초기화
    @PutMapping("/reset/{userId}")
    public ResponseEntity<CommonResponse<String>> resetUserTransferLimit(@PathVariable Long userId) {
        adminService.resetUserTransferLimit(userId);
        return ResponseEntity.ok(new CommonResponse<>("success", "송금 한도 초기화 완료", "TRANSFER LIMIT RESET"));
    }
}
