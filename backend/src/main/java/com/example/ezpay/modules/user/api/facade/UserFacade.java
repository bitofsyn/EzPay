package com.example.ezpay.modules.user.api.facade;

import com.example.ezpay.modules.user.api.dto.UserInfo;
import com.example.ezpay.modules.user.api.dto.LoginHistoryInfo;

import java.util.List;

/**
 * User 모듈의 공개 API Facade
 * 다른 모듈에서 사용자 정보에 접근할 때 이 인터페이스를 통해서만 접근
 */
public interface UserFacade {

    /**
     * 사용자 ID로 사용자 정보 조회
     */
    UserInfo getUserById(Long userId);

    /**
     * 이메일로 사용자 정보 조회
     */
    UserInfo getUserByEmail(String email);

    /**
     * 사용자 존재 여부 확인
     */
    boolean existsById(Long userId);

    /**
     * 로그인 이력 기록
     */
    void recordLogin(Long userId, String ipAddress, String deviceInfo);

    /**
     * 최근 로그인 이력 조회
     */
    List<LoginHistoryInfo> getRecentLoginHistory(Long userId, int limit);
}
