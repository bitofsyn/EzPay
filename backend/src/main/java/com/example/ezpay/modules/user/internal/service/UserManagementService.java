package com.example.ezpay.modules.user.internal.service;

import com.example.ezpay.modules.user.api.dto.LoginHistoryInfo;
import com.example.ezpay.modules.user.api.dto.UserInfo;
import com.example.ezpay.modules.user.api.dto.UserUpdateRequest;

import java.util.List;

//사용자 정보 관리 및 로그인 이력 관리
public interface UserManagementService {

    // 사용자 ID로 조회
    UserInfo getUserById(Long userId);

    // 이메일로 조회
    UserInfo getUserByEmail(String email);

    // 사용자 존재 여부 확인
    boolean existsById(Long userId);

    // 사용자 정보 수정
    UserInfo updateUser(Long userId, UserUpdateRequest request);

    // 사용자 삭제
    void deleteUser(Long userId);

    // 로그인 이력 기록
    void recordLogin(Long userId, String ipAddress, String deviceInfo);

    // 최근 로그인 이력 조회
    List<LoginHistoryInfo> getRecentLoginHistory(Long userId, int limit);
}
