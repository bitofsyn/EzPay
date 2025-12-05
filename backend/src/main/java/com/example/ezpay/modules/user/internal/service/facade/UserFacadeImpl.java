package com.example.ezpay.modules.user.internal.service.facade;

import com.example.ezpay.modules.user.api.dto.LoginHistoryInfo;
import com.example.ezpay.modules.user.api.dto.UserInfo;
import com.example.ezpay.modules.user.api.dto.UserUpdateRequest;
import com.example.ezpay.modules.user.api.facade.UserFacade;
import com.example.ezpay.modules.user.internal.service.UserManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class UserFacadeImpl implements UserFacade {

    private final UserManagementService userManagementService;

    @Override
    public UserInfo getUserById(Long userId) {
        return userManagementService.getUserById(userId);
    }

    @Override
    public UserInfo getUserByEmail(String email) {
        return userManagementService.getUserByEmail(email);
    }

    @Override
    public boolean existsById(Long userId) {
        return userManagementService.existsById(userId);
    }

    @Override
    public UserInfo updateUser(Long userId, UserUpdateRequest request) {
        return userManagementService.updateUser(userId, request);
    }

    @Override
    public void deleteUser(Long userId) {
        userManagementService.deleteUser(userId);
    }

    @Override
    public void recordLogin(Long userId, String ipAddress, String deviceInfo) {
        userManagementService.recordLogin(userId, ipAddress, deviceInfo);
    }

    @Override
    public List<LoginHistoryInfo> getRecentLoginHistory(Long userId, int limit) {
        return userManagementService.getRecentLoginHistory(userId, limit);
    }
}
