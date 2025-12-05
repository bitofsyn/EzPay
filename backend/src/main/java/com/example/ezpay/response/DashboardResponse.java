package com.example.ezpay.response;

import com.example.ezpay.model.user.Accounts;
import com.example.ezpay.model.user.Transaction;
import com.example.ezpay.modules.user.api.dto.UserInfo;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
@Builder
public class DashboardResponse {
    private UserInfo user;
    private List<Accounts> account;
    private List<Transaction> transactions;
}
