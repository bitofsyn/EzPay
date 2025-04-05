package com.example.ezpay.repository.user;

import com.example.ezpay.model.user.Transaction;
import com.example.ezpay.repository.queryDSL.TransactionRepositoryCustom;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransactionRepository extends JpaRepository<Transaction, Long>, TransactionRepositoryCustom {
    Page<Transaction> findBySenderAccount_AccountIdOrReceiverAccount_AccountId(Long senderId, Long receiverId, Pageable pageable);
}
