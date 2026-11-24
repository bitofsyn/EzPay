package com.example.ezpay.repository.user;

import com.example.ezpay.model.user.Transaction;
import com.example.ezpay.repository.queryDSL.TransactionRepositoryCustom;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TransactionRepository extends JpaRepository<Transaction, Long>, TransactionRepositoryCustom {
    // 화면 응답용 조회는 계좌 소유자 이름(ownerName)까지 직렬화하므로 송금·수취 계좌와 소유자를 함께 읽는다.
    @EntityGraph(attributePaths = {"senderAccount.user", "receiverAccount.user"})
    Page<Transaction> findBySenderAccount_AccountIdOrReceiverAccount_AccountId(Long senderId, Long receiverId, Pageable pageable);

    @EntityGraph(attributePaths = {"senderAccount.user", "receiverAccount.user"})
    Optional<Transaction> findWithPartiesByTransactionId(Long transactionId);

    @EntityGraph(attributePaths = {"senderAccount.user", "receiverAccount.user"})
    Optional<Transaction> findWithPartiesByRequestId(String requestId);

    // 송금 컨슈머의 멱등성 검사용 (연관 로딩 불필요)
    Optional<Transaction> findByRequestId(String requestId);
}
