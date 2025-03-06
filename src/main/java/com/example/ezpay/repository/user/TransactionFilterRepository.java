package com.example.ezpay.repository.user;

import com.example.ezpay.model.user.TransactionFilter;
import com.example.ezpay.repository.queryDSL.TransactionFilterRepositoryCustom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionFilterRepository extends JpaRepository<TransactionFilter, Long> , TransactionFilterRepositoryCustom {
    List<TransactionFilter> findByUser_UserId(Long userId);
}
