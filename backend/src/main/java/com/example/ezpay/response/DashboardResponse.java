package com.example.ezpay.response;

import com.example.ezpay.model.user.Accounts;
import com.example.ezpay.model.user.Transaction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@AllArgsConstructor
@Builder
public class DashboardResponse {
    private UserResponse user;
    private List<Accounts> account;
    private List<Transaction> transactions;
}
