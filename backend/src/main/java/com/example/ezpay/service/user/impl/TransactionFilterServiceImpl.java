package com.example.ezpay.service.user.impl;

import com.example.ezpay.model.user.TransactionFilter;
import com.example.ezpay.model.user.User;
import com.example.ezpay.repository.user.TransactionFilterRepository;
import com.example.ezpay.repository.user.UserRepository;
import com.example.ezpay.request.TransactionFilterRequest;
import com.example.ezpay.response.TransactionFilterResponse;
import com.example.ezpay.service.user.TransactionFilterService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TransactionFilterServiceImpl implements TransactionFilterService {
    private final TransactionFilterRepository transactionFilterRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public TransactionFilter saveFilter(TransactionFilterRequest transactionFilterRequest) {
        User user = userRepository.findById(transactionFilterRequest.getUserId())
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));

        TransactionFilter transactionFilter = transactionFilterRequest.toEntity(user);
        return transactionFilterRepository.save(transactionFilter);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TransactionFilter> readFilterByUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));
        return transactionFilterRepository.findByUser_UserId(userId);
    }

    // 특정 필터 조회
    @Override
    public TransactionFilter getFilterById(Long id) {
        return transactionFilterRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("필터를 찾을 수 없습니다."));
    }

    // 필터 조건 검색(날짜 범위, 금액 범위로 검색)
    @Override
    @Transactional(readOnly = true)
    public List<TransactionFilter> searchFilter(TransactionFilterRequest transactionFilterRequest) {
        return transactionFilterRepository.searchFilters(transactionFilterRequest);
    }


    @Override
    @Transactional
    public TransactionFilterResponse updateFilter(Long id, TransactionFilterRequest transactionFilterRequest) {
        TransactionFilter filter = transactionFilterRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("필터를 찾을 수 없습니다."));

        filter.setStartDate(transactionFilterRequest.getStartDate() != null ? transactionFilterRequest.getStartDate() : filter.getStartDate());
        filter.setEndDate(transactionFilterRequest.getEndDate() != null ? transactionFilterRequest.getEndDate() : filter.getEndDate());
        filter.setMinAmount(transactionFilterRequest.getMinAmount() != null ? transactionFilterRequest.getMinAmount() : filter.getMinAmount());
        filter.setMaxAmount(transactionFilterRequest.getMaxAmount() != null ? transactionFilterRequest.getMaxAmount() : filter.getMaxAmount());

        transactionFilterRepository.save(filter);

        return new TransactionFilterResponse(filter);  // ✅ DTO 변환하여 반환
    }



    @Override
    @Transactional
    public void deleteFilter(Long id) {
        TransactionFilter filter = transactionFilterRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("필터를 찾을 수 없습니다."));

        transactionFilterRepository.delete(filter);
    }
}
