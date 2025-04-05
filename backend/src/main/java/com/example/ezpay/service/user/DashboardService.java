package com.example.ezpay.service.user;

import com.example.ezpay.model.user.Transaction;
import com.example.ezpay.response.DashboardResponse;
import org.springframework.security.core.Authentication;

import java.util.List;

public interface DashboardService {
    DashboardResponse getDashboardInfo(Authentication authentication);
    List<Transaction> getRecentTransactions(Long accountId, String sort, int limit);
}
