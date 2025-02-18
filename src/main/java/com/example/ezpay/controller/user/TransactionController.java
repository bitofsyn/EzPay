package com.example.ezpay.controller.user;

import com.example.ezpay.kafka.TransactionProducer;
import com.example.ezpay.model.kafka.TransferEvent;
import com.example.ezpay.response.CommonResponse;
import com.example.ezpay.service.user.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/transaction")
@RequiredArgsConstructor
public class TransactionController {
    private final TransactionService transactionService;
    private final TransactionProducer transactionProducer;

    // 송금 요청
    @PostMapping("/transfer")
    public ResponseEntity<CommonResponse<String>> transfer(@RequestParam Long fromAccountId,
                                                           @RequestParam Long toAccountId,
                                                           @RequestParam BigDecimal amount) {

        TransferEvent event = new TransferEvent(fromAccountId, toAccountId, amount);
        transactionProducer.sendTransferEvent(event);
        return ResponseEntity.ok(new CommonResponse<>("success", "Transfer request sent", "TRANSFER REQUESTED"));
    }
}
