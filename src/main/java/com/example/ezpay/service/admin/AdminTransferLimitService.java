package com.example.ezpay.service.admin;

import com.example.ezpay.model.user.TransferLimit;
import com.example.ezpay.request.TransferLimitRequest;

import java.util.List;

public interface AdminTransferLimitService {
    List<TransferLimit> getAllTransferLimits();
    void updateUserTransferLimit(TransferLimitRequest transferLimitRequest);
    void deleteUserTransferLimit(Long userId);
}
