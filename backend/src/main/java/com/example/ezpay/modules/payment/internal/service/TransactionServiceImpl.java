package com.example.ezpay.modules.payment.internal.service;

import com.example.ezpay.shared.common.enums.NotificationType;
import com.example.ezpay.model.user.*;
import com.example.ezpay.shared.exception.CustomNotFoundException;
import com.example.ezpay.shared.exception.TransferLimitExceededException;
import com.example.ezpay.kafka.TransactionProducer;
import com.example.ezpay.shared.common.enums.ErrorLogStatus;
import com.example.ezpay.shared.common.enums.TransactionStatus;
import com.example.ezpay.shared.messaging.events.TransferEvent;
import com.example.ezpay.repository.user.*;
import com.example.ezpay.modules.payment.api.dto.AccountOwnerInfo;
import com.example.ezpay.modules.payment.api.dto.TransferRequest;
import com.example.ezpay.modules.notification.internal.service.NotificationService;
import com.example.ezpay.service.user.ErrorLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TransactionServiceImpl implements TransactionService {
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final TransactionProducer transactionProducer;
    private final TransferLimitRepository transferLimitRepository;
    private final TrainingDataRepository trainingDataRepository;
    private final NotificationRepository notificationRepository;
    private final ErrorLogService errorLogService;
    private final NotificationService notificationService;

    // 송금 요청 (kafka 이벤트 발행)
    @Override
    public String transferMoney(TransferRequest transferRequest) {
        String requestId = UUID.randomUUID().toString();

        // 1. 송금 이벤트 객체 생성
        TransferEvent event = new TransferEvent(requestId, transferRequest.getFromAccountId(), transferRequest.getToAccountId(), transferRequest.getAmount(),
                transferRequest.getMemo(), transferRequest.getCategory(), transferRequest.isCategoryManuallyEdited());

        // 2. Kafka에 이벤트 발행
        transactionProducer.sendTransferEvent(event);

        return requestId;
    }

    // kafka 이벤트 수신 후 송금 처리
    @Override
    @Transactional(transactionManager = "transactionManager")
    public Transaction processTransfer(TransferEvent event) {
        if (event.getRequestId() == null || event.getRequestId().isBlank()) {
            throw new IllegalArgumentException("requestId가 비어있습니다.");
        }

        // idempotency (at-least-once 대응)
        Transaction existing = transactionRepository.findByRequestId(event.getRequestId()).orElse(null);
        if (existing != null) {
            return existing;
        }

        // 계좌 락은 항상 같은 순서로 잡아 데드락을 줄임
        Long firstLockId = event.getFromAccountId() <= event.getToAccountId() ? event.getFromAccountId() : event.getToAccountId();
        Long secondLockId = event.getFromAccountId() <= event.getToAccountId() ? event.getToAccountId() : event.getFromAccountId();

        Accounts firstLocked = accountRepository.findByIdForUpdate(firstLockId)
                .orElseThrow(() -> new CustomNotFoundException("계좌를 찾을 수 없습니다."));
        Accounts secondLocked = accountRepository.findByIdForUpdate(secondLockId)
                .orElseThrow(() -> new CustomNotFoundException("계좌를 찾을 수 없습니다."));

        Accounts fromAccount = firstLockId.equals(event.getFromAccountId()) ? firstLocked : secondLocked;
        Accounts toAccount = firstLockId.equals(event.getToAccountId()) ? firstLocked : secondLocked;

        Transaction transaction = Transaction.builder()
                .requestId(event.getRequestId())
                .senderAccount(fromAccount)
                .receiverAccount(toAccount)
                .amount(event.getAmount())
                .memo(event.getMemo())
                .category(event.getCategory())
                .status(TransactionStatus.PROCESSING)
                .description("송금 처리중")
                .build();

        try {
            transactionRepository.save(transaction);
        } catch (DataIntegrityViolationException e) {
            return transactionRepository.findByRequestId(event.getRequestId())
                    .orElseThrow(() -> e);
        }

        try {
            TransferLimit transferLimit = transferLimitRepository.findByUserId(fromAccount.getUser().getUserId())
                    .orElseThrow(() -> new CustomNotFoundException("송금 한도 정보를 찾을 수 없습니다."));

            if (event.getAmount() == null || event.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("송금 금액이 올바르지 않습니다.");
            }

            if (fromAccount.getAccountId().equals(toAccount.getAccountId())) {
                throw new IllegalArgumentException("동일한 계좌로 송금할 수 없습니다.");
            }

            if (fromAccount.getBalance().compareTo(event.getAmount()) < 0) {
                throw new IllegalArgumentException("잔액 부족으로 송금할 수 없습니다.");
            }

            if (event.getAmount().compareTo(transferLimit.getPerTransactionLimit()) > 0) {
                throw new TransferLimitExceededException("1회 송금 한도를 초과했습니다.");
            }

            BigDecimal todayTotalTransfers = transactionRepository.sumTodayTransactionBySender(fromAccount.getAccountId(), LocalDate.now());
            if (todayTotalTransfers == null) {
                todayTotalTransfers = BigDecimal.ZERO;
            }
            if (todayTotalTransfers.add(event.getAmount()).compareTo(transferLimit.getDailyLimit()) > 0) {
                throw new TransferLimitExceededException("하루 송금 한도를 초과했습니다.");
            }

            fromAccount.setBalance(fromAccount.getBalance().subtract(event.getAmount()));
            toAccount.setBalance(toAccount.getBalance().add(event.getAmount()));

            accountRepository.save(fromAccount);
            accountRepository.save(toAccount);

            transaction.setStatus(TransactionStatus.SUCCESS);
            transaction.setDescription("송금 완료");
            Transaction saved = transactionRepository.save(transaction);

            // 알림/학습데이터 저장은 송금 성공을 깨지 않도록 분리(실패시 로그만 남김)
            try {
                User sender = fromAccount.getUser();
                User receiver = toAccount.getUser();

                if (isEmailNotificationEnabled(sender)) {
                    notificationService.sendMail(
                            sender.getEmail(),
                            event.getAmount().longValue(),
                            receiver.getName()
                    );
                }
            } catch (Exception notifyError) {
                errorLogService.logError("Notification", "이메일 발송 실패: " + notifyError.getMessage(), ErrorLogStatus.UNRESOLVED);
            }

            try {
                if (event.isCategoryManuallyEdited()) {
                    TrainingData trainingData = new TrainingData();
                    trainingData.setMemo(event.getMemo());
                    trainingData.setReceiverName(toAccount.getUser().getName());
                    trainingData.setCategory(event.getCategory());
                    trainingDataRepository.save(trainingData);
                }
            } catch (Exception trainingError) {
                errorLogService.logError("TrainingData", "학습데이터 저장 실패: " + trainingError.getMessage(), ErrorLogStatus.UNRESOLVED);
            }

            return saved;
        } catch (CustomNotFoundException | TransferLimitExceededException | IllegalArgumentException e) {
            transaction.setStatus(TransactionStatus.FAILED);
            transaction.setDescription(e.getMessage());
            transactionRepository.save(transaction);
            errorLogService.logError("Transaction Service", e.getMessage(), ErrorLogStatus.UNRESOLVED);
            return transaction;
        } catch (Exception e) {
            errorLogService.logError("Transaction Service", "알수 없는 오류 발생:" + e.getMessage(), ErrorLogStatus.UNRESOLVED);
            throw e;
        }
    }

    private boolean isEmailNotificationEnabled(User user) {
        return notificationRepository
                .findByUserAndNotificationType(user, NotificationType.EMAIL)
                .map(Notification::getIsEnabled)
                .orElse(false);
    }

    @Override
    public List<Transaction> getTransactionByAccount(Long accountId) {
        return transactionRepository.findTransactionByAccount(accountId);
    }

    @Override
    public Transaction getTransactionById(Long transactionId) {
        return transactionRepository.findById(transactionId)
                .orElseThrow(() -> new CustomNotFoundException("거래 내역을 찾을 수 없습니다. : " + transactionId));
    }

    @Override
    public Transaction getTransactionByRequestId(String requestId) {
        return transactionRepository.findByRequestId(requestId)
                .orElseThrow(() -> new CustomNotFoundException("거래 내역을 찾을 수 없습니다. : " + requestId));
    }

    // 거래 취소
    @Override
    @Transactional
    public void cancelTransaction(Long transactionId) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new CustomNotFoundException("거래 내역을 찾을 수 없습니다: " + transactionId));

        if (!transaction.getStatus().equals(TransactionStatus.SUCCESS)) {
            throw new IllegalArgumentException("이미 취소된 거래이거나 실패한 거래입니다.");
        }

        // 24시간 이내 취소 가능하도록 체크
        long now = System.currentTimeMillis();
        long transactionTime = transaction.getTransactionDate().getTime();
        if ((now - transactionTime) > 24 * 60 * 60 * 1000) {
            throw new IllegalArgumentException("거래는 24시간 이내에만 취소할 수 있습니다.");
        }

        Accounts sender = transaction.getSenderAccount();
        Accounts receiver = transaction.getReceiverAccount();

        // 동시성 대비 (취소도 잔액 조정이므로 락)
        Long firstLockId = sender.getAccountId() <= receiver.getAccountId() ? sender.getAccountId() : receiver.getAccountId();
        Long secondLockId = sender.getAccountId() <= receiver.getAccountId() ? receiver.getAccountId() : sender.getAccountId();
        accountRepository.findByIdForUpdate(firstLockId)
                .orElseThrow(() -> new CustomNotFoundException("계좌를 찾을 수 없습니다."));
        accountRepository.findByIdForUpdate(secondLockId)
                .orElseThrow(() -> new CustomNotFoundException("계좌를 찾을 수 없습니다."));

        if (receiver.getBalance().compareTo(transaction.getAmount()) < 0) {
            throw new IllegalArgumentException("수신 계좌 잔액 부족으로 취소할 수 없습니다.");
        }

        // 💡 취소 시 원래대로 돌려놓음
        sender.setBalance(sender.getBalance().add(transaction.getAmount()));
        receiver.setBalance(receiver.getBalance().subtract(transaction.getAmount()));

        accountRepository.save(sender);
        accountRepository.save(receiver);

        transaction.setStatus(TransactionStatus.CANCELLED);
        transactionRepository.save(transaction);
    }

    @Override
    public List<Transaction> getSentTransactions(Long senderAccountId) {
        return transactionRepository.findSentTransactions(senderAccountId);
    }

    @Override
    public List<Transaction> getReceivedTransactions(Long receiverAccountId) {
        return transactionRepository.findReceivedTransactions(receiverAccountId);
    }

    @Override
    public AccountOwnerInfo getOwnerNameByAccountNumber(String accountNumber) {
        Accounts account = accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new CustomNotFoundException("계좌를 찾을 수 없습니다."));


        return new AccountOwnerInfo(
                account.getAccountNumber(),
                account.getUser().getName(),
                account.getAccountId(),
                account.getBankName()
        );
    }

    // 대시보드(최근 거래 내역)

    @Override
    public List<Transaction> getRecentTransactionByAccount(Long accountId, String sort, int limit) {
        Sort.Direction direction = sort.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(0, limit, Sort.by(direction, "transactionDate"));
        return transactionRepository
                .findBySenderAccount_AccountIdOrReceiverAccount_AccountId(accountId, accountId, pageable)
                .getContent();
    }
}
