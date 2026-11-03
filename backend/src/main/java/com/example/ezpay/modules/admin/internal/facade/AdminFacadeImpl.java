package com.example.ezpay.modules.admin.internal.facade;

import com.example.ezpay.modules.admin.api.facade.AdminFacade;
import com.example.ezpay.modules.admin.internal.service.AdminService;
import com.example.ezpay.modules.payment.api.dto.TransactionInfo;
import com.example.ezpay.modules.user.api.dto.UserInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * AdminFacade 구현체
 * 다른 모듈에서 Admin 기능을 사용할 때 이 Facade를 통해 접근
 */
@Component
@RequiredArgsConstructor
public class AdminFacadeImpl implements AdminFacade {

    private final AdminService adminService;

    @Override
    public List<UserInfo> getAllUsers() {
        return adminService.getAllUsers();
    }

    @Override
    public List<TransactionInfo> getAllTransactions() {
        return adminService.getAllTransactions();
    }

    @Override
    public List<TransactionInfo> getUserTransactions(Long userId) {
        return adminService.getUserTransactions(userId);
    }
}
