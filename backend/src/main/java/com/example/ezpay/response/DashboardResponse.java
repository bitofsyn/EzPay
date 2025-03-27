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
    private Accounts account;
    private BigDecimal balance;
    private List<Transaction> transactions;
}
