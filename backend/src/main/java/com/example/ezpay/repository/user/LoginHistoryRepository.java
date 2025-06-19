package com.example.ezpay.repository.user;

import com.example.ezpay.model.user.LoginHistory;
import com.example.ezpay.model.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LoginHistoryRepository extends JpaRepository<LoginHistory, Long> {
    List<LoginHistory> findTop10ByUser_UserIdOrderByTimestampDesc(Long userId);

    void deleteByUser_UserId(Long userId);

}
