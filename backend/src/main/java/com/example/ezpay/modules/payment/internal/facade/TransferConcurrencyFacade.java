package com.example.ezpay.modules.payment.internal.facade;

import com.example.ezpay.model.user.Accounts;
import com.example.ezpay.model.user.Transaction;
import com.example.ezpay.modules.payment.internal.service.TransactionService;
import com.example.ezpay.repository.user.AccountRepository;
import com.example.ezpay.repository.user.TransactionRepository;
import com.example.ezpay.shared.exception.CustomNotFoundException;
import com.example.ezpay.shared.messaging.events.TransferEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 계좌 락의 생명주기와 송금 트랜잭션 경계를 관리한다.
 * 항상 작은 계좌 ID부터 잠가 반대 방향 송금에서 발생할 수 있는 데드락을 줄인다.
 */
@Component
@RequiredArgsConstructor
public class TransferConcurrencyFacade {

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final TransactionService transactionService;

    @Transactional(transactionManager = "transactionManager")
    public Transaction process(TransferEvent event) {
        validate(event);

        Transaction existing = transactionRepository.findByRequestId(event.getRequestId()).orElse(null);
        if (existing != null) {
            return existing;
        }

        long firstId = Math.min(event.getFromAccountId(), event.getToAccountId());
        long secondId = Math.max(event.getFromAccountId(), event.getToAccountId());

        Accounts firstLocked = lock(firstId);
        Accounts secondLocked = lock(secondId);

        Accounts fromAccount = event.getFromAccountId().equals(firstId) ? firstLocked : secondLocked;
        Accounts toAccount = event.getToAccountId().equals(firstId) ? firstLocked : secondLocked;

        return transactionService.processTransfer(event, fromAccount, toAccount);
    }

    private Accounts lock(Long accountId) {
        return accountRepository.findByIdForUpdate(accountId)
                .orElseThrow(() -> new CustomNotFoundException("계좌를 찾을 수 없습니다: " + accountId));
    }

    private void validate(TransferEvent event) {
        if (event == null) {
            throw new IllegalArgumentException("송금 이벤트가 비어있습니다.");
        }
        if (event.getRequestId() == null || event.getRequestId().isBlank()) {
            throw new IllegalArgumentException("requestId가 비어있습니다.");
        }
        if (event.getFromAccountId() == null || event.getToAccountId() == null) {
            throw new IllegalArgumentException("송금 계좌 정보가 비어있습니다.");
        }
        if (event.getFromAccountId().equals(event.getToAccountId())) {
            throw new IllegalArgumentException("동일한 계좌로 송금할 수 없습니다.");
        }
    }
}
