package com.example.ezpay.service.admin.Impl;

import com.example.ezpay.exception.CustomNotFoundException;
import com.example.ezpay.model.user.TransferLimit;
import com.example.ezpay.repository.user.TransferLimitRepository;
import com.example.ezpay.request.TransferLimitRequest;
import com.example.ezpay.service.admin.AdminTransferLimitService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminTransferLimitServiceImpl implements AdminTransferLimitService {
    private final TransferLimitRepository transferLimitRepository;

    @Override
    public List<TransferLimit> getAllTransferLimits() {
        return transferLimitRepository.findAll();
    }

    @Override
    @Transactional
    public void updateUserTransferLimit(TransferLimitRequest transferLimitRequest) {
        TransferLimit transferLimit = transferLimitRepository.findByUserId(transferLimitRequest.getUserId())
                .orElseThrow(() -> new CustomNotFoundException("송금 한도를 찾을 수 없습니다."));

        transferLimit.setDailyLimit(transferLimitRequest.getDailyLimit());
        transferLimit.setPerTransactionLimit(transferLimitRequest.getPerTransactionLimit());
        transferLimitRepository.save(transferLimit);
    }

    @Override
    public void deleteUserTransferLimit(Long userId) {
        TransferLimit transferLimit = transferLimitRepository.findByUserId(userId)
                .orElseThrow(() -> new CustomNotFoundException("송금 한도를 찾을 수 없습니다."));

        transferLimitRepository.delete(transferLimit);
    }
}
