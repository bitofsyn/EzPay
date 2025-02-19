package com.example.ezpay.service.user;

import com.example.ezpay.model.user.TransferLimit;
import com.example.ezpay.request.TransferLimitRequest;

public interface TransferLimitService {
    TransferLimit readUserTransferLimit(Long userId);
    void updateUserTransferLimit(TransferLimitRequest transferLimitRequest);
}
