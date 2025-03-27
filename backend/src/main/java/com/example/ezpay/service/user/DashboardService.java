package com.example.ezpay.service.user;

import com.example.ezpay.response.DashboardResponse;

public interface DashboardService {
    DashboardResponse getDashboardInfo(String email);
}
