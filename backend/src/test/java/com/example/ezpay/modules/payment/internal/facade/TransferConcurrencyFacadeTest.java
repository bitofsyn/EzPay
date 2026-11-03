package com.example.ezpay.modules.payment.internal.facade;

import com.example.ezpay.model.user.Accounts;
import com.example.ezpay.model.user.Transaction;
import com.example.ezpay.modules.payment.internal.service.TransactionService;
import com.example.ezpay.repository.user.AccountRepository;
import com.example.ezpay.repository.user.TransactionRepository;
import com.example.ezpay.shared.messaging.events.TransferEvent;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TransferConcurrencyFacadeTest {

    @Mock AccountRepository accountRepository;
    @Mock TransactionRepository transactionRepository;
    @Mock TransactionService transactionService;

    @Test
    void locksAccountsInAscendingOrderEvenWhenTransferDirectionIsReversed() {
        TransferConcurrencyFacade facade = new TransferConcurrencyFacade(
                accountRepository, transactionRepository, transactionService);
        TransferEvent event = event("request-1", 20L, 10L);
        Accounts lower = account(10L, "1000");
        Accounts higher = account(20L, "1000");
        Transaction processed = new Transaction();

        when(transactionRepository.findByRequestId("request-1")).thenReturn(Optional.empty());
        when(accountRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(lower));
        when(accountRepository.findByIdForUpdate(20L)).thenReturn(Optional.of(higher));
        when(transactionService.processTransfer(event, higher, lower)).thenReturn(processed);

        assertThat(facade.process(event)).isSameAs(processed);

        InOrder lockOrder = inOrder(accountRepository);
        lockOrder.verify(accountRepository).findByIdForUpdate(10L);
        lockOrder.verify(accountRepository).findByIdForUpdate(20L);
        verify(transactionService).processTransfer(event, higher, lower);
    }

    @Test
    void returnsExistingTransactionWithoutAcquiringLocks() {
        TransferConcurrencyFacade facade = new TransferConcurrencyFacade(
                accountRepository, transactionRepository, transactionService);
        TransferEvent event = event("request-2", 10L, 20L);
        Transaction existing = new Transaction();
        when(transactionRepository.findByRequestId("request-2")).thenReturn(Optional.of(existing));

        assertThat(facade.process(event)).isSameAs(existing);

        verifyNoInteractions(accountRepository, transactionService);
    }

    private TransferEvent event(String requestId, Long fromId, Long toId) {
        return new TransferEvent(requestId, fromId, toId, new BigDecimal("100"),
                "memo", "category", false);
    }

    private Accounts account(Long id, String balance) {
        return Accounts.builder()
                .accountId(id)
                .accountNumber("account-" + id)
                .bankName("EzPay")
                .balance(new BigDecimal(balance))
                .build();
    }
}
