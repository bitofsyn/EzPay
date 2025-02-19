package com.example.ezpay.service.user;

import com.example.ezpay.model.user.TransferLimit;
import com.example.ezpay.request.TransferLimitRequest;

import java.util.List;

public interface TransferLimitService {
    List<TransferLimit> getAllTransferLimits();
    TransferLimit readUserTransferLimit(Long userId);
    void updateUserTransferLimit(Long userId, TransferLimitRequest transferLimitRequest);

    void resetUserTransferLimit(Long userId);
}
