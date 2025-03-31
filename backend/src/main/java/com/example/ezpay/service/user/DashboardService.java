package com.example.ezpay.service.user;

import com.example.ezpay.response.DashboardResponse;
import org.springframework.security.core.Authentication;

public interface DashboardService {
    DashboardResponse getDashboardInfo(Authentication authentication);
}
