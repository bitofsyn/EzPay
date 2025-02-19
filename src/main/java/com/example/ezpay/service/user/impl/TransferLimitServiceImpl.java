package com.example.ezpay.service.user.impl;

import com.example.ezpay.exception.CustomNotFoundException;
import com.example.ezpay.model.user.TransferLimit;
import com.example.ezpay.repository.user.TransferLimitRepository;
import com.example.ezpay.repository.user.UserRepository;
import com.example.ezpay.request.TransferLimitRequest;
import com.example.ezpay.service.user.TransferLimitService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TransferLimitServiceImpl implements TransferLimitService {
    private final TransferLimitRepository transferLimitRepository;
    private final UserRepository userRepository;

    @Override
    public TransferLimit readUserTransferLimit(Long userId) {
        return transferLimitRepository.findByUserId(userId)
                .orElseThrow(() -> new CustomNotFoundException("송금 한도를 찾을 수 없습니다."));
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
}
