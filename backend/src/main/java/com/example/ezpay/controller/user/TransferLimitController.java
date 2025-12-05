package com.example.ezpay.controller.user;

import com.example.ezpay.model.user.TransferLimit;
import com.example.ezpay.modules.payment.internal.service.TransferLimitService;
import com.example.ezpay.request.TransferLimitRequest;
import com.example.ezpay.shared.common.dto.CommonResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/transfer-limits")
@RequiredArgsConstructor
public class TransferLimitController {
    private final TransferLimitService transferLimitService;

    // 본인의 송금 한도 조회
    @GetMapping("/{userId}")
    public ResponseEntity<CommonResponse<TransferLimit>> readTransferLimit(@PathVariable Long userId) {
        TransferLimit transferLimit = transferLimitService.readUserTransferLimit(userId);
        return ResponseEntity.ok(new CommonResponse<>("success", transferLimit, "송금 한도 조회 성공"));
    }

    // 본인 송금 한도 설정 (자신만 가능)
    @PutMapping("/{userId}")
    public ResponseEntity<CommonResponse<String>> updateUserTransferLimit(@PathVariable Long userId,
                                                                          @RequestBody TransferLimitRequest transferLimitRequest) {
        transferLimitService.updateUserTransferLimit(userId, transferLimitRequest);
        return ResponseEntity.ok(new CommonResponse<>("success", "송금 한도 수정 완료", "TRANSFER LIMIT UPDATED"));
    }
}
