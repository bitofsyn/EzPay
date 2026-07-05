package com.example.ezpay.modules.payment.internal.service;

import com.example.ezpay.shared.common.enums.NotificationType;
import com.example.ezpay.model.user.*;
import com.example.ezpay.shared.exception.CustomNotFoundException;
import com.example.ezpay.shared.exception.FraudBlockedException;
import com.example.ezpay.shared.exception.FraudHeldException;
import com.example.ezpay.shared.exception.TransferLimitExceededException;
import com.example.ezpay.kafka.TransactionProducer;
import com.example.ezpay.shared.common.enums.ErrorLogStatus;
import com.example.ezpay.shared.common.enums.TransactionStatus;
import com.example.ezpay.shared.messaging.events.TransferEvent;
import com.example.ezpay.repository.user.*;
import com.example.ezpay.modules.payment.api.dto.AccountOwnerInfo;
import com.example.ezpay.modules.payment.api.dto.TransferRequest;
import com.example.ezpay.modules.notification.internal.service.NotificationService;
import com.example.ezpay.modules.notification.internal.service.UserNotificationService;
import com.example.ezpay.modules.realtime.EventBroadcaster;
import com.example.ezpay.modules.realtime.dto.PipelineStage;
import com.example.ezpay.modules.realtime.dto.PipelineStageStatus;
import com.example.ezpay.modules.realtime.dto.TransactionPipelineEvent;
import com.example.ezpay.modules.risk.entity.RiskLevel;
import com.example.ezpay.modules.risk.entity.RiskTransaction;
import com.example.ezpay.modules.risk.entity.RiskTransactionStatus;
import com.example.ezpay.modules.risk.fds.FraudDetectionService;
import com.example.ezpay.modules.risk.fds.dto.FraudCheckContext;
import com.example.ezpay.modules.risk.fds.dto.FraudCheckResult;
import com.example.ezpay.modules.risk.service.RiskTransactionService;
import com.example.ezpay.modules.systemlog.service.SystemLogger;
import com.example.ezpay.shared.common.enums.UserNotificationCategory;
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
import java.time.LocalDateTime;
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
    private final UserNotificationService userNotificationService;
    private final EventBroadcaster eventBroadcaster;
    private final RiskTransactionService riskTransactionService;
    private final FraudDetectionService fraudDetectionService;
    private final SystemLogger systemLogger;

    // 관리자 대시보드 실시간 트랜잭션 파이프라인 SSE 채널
    private static final String PIPELINE_CHANNEL = "transaction-pipeline";

    // 시스템 로그 서비스 이름(관리자 시스템 로그 화면 표시용)
    private static final String LOG_SERVICE = "TransferService";
    private static final String LOG_SERVICE_RISK = "RiskDetection";

    // AI 이상거래 탐지 임계값(원). 초과 송금은 관리자 검토 대기(PENDING_REVIEW) 위험 거래로 적재된다.
    private static final BigDecimal RISK_DANGER_THRESHOLD = new BigDecimal("3000000");
    private static final BigDecimal RISK_CAUTION_THRESHOLD = new BigDecimal("1000000");

    // 송금 처리 각 단계를 파이프라인 SSE 채널로 브로드캐스트한다.
    // 송금 성공/실패를 절대 깨지 않도록 예외는 삼킨다.
    private void broadcastPipeline(Long txId, Accounts from, Accounts to, BigDecimal amount,
                                   long startedAtMs, PipelineStage stage, PipelineStageStatus status, String message) {
        try {
            eventBroadcaster.broadcastToSse(PIPELINE_CHANNEL, TransactionPipelineEvent.of(
                    "TX" + txId, stage, status,
                    "#" + from.getAccountId(), "#" + to.getAccountId(), amount,
                    System.currentTimeMillis() - startedAtMs, message
            ));
        } catch (Exception ignore) {
            // 파이프라인 표시는 부가 기능이므로 실패해도 송금 흐름에 영향 주지 않음
        }
    }

    // 송금 성공 후 금액 기반 이상거래 모니터링. 통과된 위험/주의 거래를 관리자 검토 큐에 적재한다.
    // 탐지는 부가 기능이므로 실패해도 송금 성공 흐름을 깨지 않는다.
    private void detectRisk(Transaction transaction, Accounts fromAccount, Accounts toAccount, BigDecimal amount) {
        try {
            if (amount == null) return;

            RiskLevel level;
            String reason;
            if (amount.compareTo(RISK_DANGER_THRESHOLD) >= 0) {
                level = RiskLevel.DANGER;
                reason = String.format("고액 송금 감지: ₩%,d. 이상 거래 패턴으로 의심되어 검토가 필요합니다.", amount.longValue());
            } else if (amount.compareTo(RISK_CAUTION_THRESHOLD) >= 0) {
                level = RiskLevel.CAUTION;
                reason = String.format("평소보다 큰 금액(₩%,d)의 송금입니다. 확인이 필요합니다.", amount.longValue());
            } else {
                return; // 정상 거래는 적재하지 않음
            }

            recordRisk(transaction, fromAccount, toAccount, amount, level, reason, RiskTransactionStatus.PENDING_REVIEW);

            // 시스템 로그: 위험거래 감지(WARN). 레벨(DANGER/CAUTION)은 메시지로 구분한다.
            systemLogger.warn(LOG_SERVICE_RISK, String.format(
                    "위험거래 감지: TX%d [%s] ₩%,d - %s",
                    transaction.getTransactionId(), level, amount.longValue(), reason));
        } catch (Exception e) {
            errorLogService.logError("Risk Detection", "위험 거래 탐지/저장 실패: " + e.getMessage(), ErrorLogStatus.UNRESOLVED);
        }
    }

    // 위험 거래를 관리자 검토 큐(RiskTransaction)에 적재한다. 사후 모니터링과 사전 FDS 차단/보류가 공유한다.
    private void recordRisk(Transaction transaction, Accounts fromAccount, Accounts toAccount, BigDecimal amount,
                            RiskLevel level, String reason, RiskTransactionStatus status) {
        RiskTransaction risk = RiskTransaction.builder()
                .transactionId("TX" + transaction.getTransactionId())
                .level(level)
                .sender(fromAccount.getUser().getName())
                .receiver(toAccount.getUser().getName())
                .amount(amount)
                .transactionDatetime(LocalDateTime.now())
                .category(transaction.getCategory())
                .reason(reason)
                .status(status)
                .build();
        riskTransactionService.save(risk);
    }

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

        // 1단계: 송금 요청 접수
        long pipelineStart = System.currentTimeMillis();
        broadcastPipeline(transaction.getTransactionId(), fromAccount, toAccount, event.getAmount(),
                pipelineStart, PipelineStage.RECEIVED, PipelineStageStatus.PROCESSING, "송금 요청을 접수했습니다");

        try {
            // 2단계: 이상거래/한도 검증
            broadcastPipeline(transaction.getTransactionId(), fromAccount, toAccount, event.getAmount(),
                    pipelineStart, PipelineStage.RISK_CHECK, PipelineStageStatus.PROCESSING, "이상거래 및 한도를 검증하고 있습니다");

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

            // 사전 위험도 분석(FDS): 원장 기록 직전, 결과를 즉시 받아 송금 진행 여부를 결정한다.
            // 계좌 락을 잡은 상태이므로 in-process 동기 평가로 처리하며, 서비스 장애는 서킷 브레이커로 격리한다.
            FraudCheckContext fraudContext = FraudCheckContext.builder()
                    .requestId(event.getRequestId())
                    .fromAccountId(fromAccount.getAccountId())
                    .toAccountId(toAccount.getAccountId())
                    .fromAccountNumber(fromAccount.getAccountNumber())
                    .toAccountNumber(toAccount.getAccountNumber())
                    .senderName(fromAccount.getUser().getName())
                    .receiverName(toAccount.getUser().getName())
                    .amount(event.getAmount())
                    .category(event.getCategory())
                    .build();
            FraudCheckResult fraudResult = fraudDetectionService.evaluate(fraudContext);

            if (fraudResult.isBlocked()) {
                // 사기 판정: 관리자 검토 큐에 차단 이력 적재 후 송금 차단
                recordRisk(transaction, fromAccount, toAccount, event.getAmount(),
                        fraudResult.getLevel(), fraudResult.getReason(), RiskTransactionStatus.BLOCKED);
                throw new FraudBlockedException(fraudResult.getReason());
            }
            if (fraudResult.isHeld()) {
                // FDS 장애 등 fail-safe: 관리자 검토 큐에 보류 이력 적재 후 송금 일시 보류
                recordRisk(transaction, fromAccount, toAccount, event.getAmount(),
                        fraudResult.getLevel(), fraudResult.getReason(), RiskTransactionStatus.PENDING_REVIEW);
                throw new FraudHeldException(fraudResult.getReason());
            }

            // 3단계: 분산 원장(잔액) 기록
            broadcastPipeline(transaction.getTransactionId(), fromAccount, toAccount, event.getAmount(),
                    pipelineStart, PipelineStage.LEDGER, PipelineStageStatus.PROCESSING, "원장에 거래를 기록하고 있습니다");

            fromAccount.setBalance(fromAccount.getBalance().subtract(event.getAmount()));
            toAccount.setBalance(toAccount.getBalance().add(event.getAmount()));

            accountRepository.save(fromAccount);
            accountRepository.save(toAccount);

            transaction.setStatus(TransactionStatus.SUCCESS);
            transaction.setDescription("송금 완료");
            Transaction saved = transactionRepository.save(transaction);

            // 4단계: 정산 및 완료
            broadcastPipeline(transaction.getTransactionId(), fromAccount, toAccount, event.getAmount(),
                    pipelineStart, PipelineStage.SETTLEMENT, PipelineStageStatus.COMPLETED, "정산이 완료되어 거래가 종료되었습니다");

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

            // 알림 피드 저장 + 실시간(SSE) 전송 (실패해도 송금은 성공 처리)
            try {
                User sender = fromAccount.getUser();
                User receiver = toAccount.getUser();
                String amountText = String.format("%,d원", event.getAmount().longValue());

                userNotificationService.create(
                        sender,
                        UserNotificationCategory.TRANSFER,
                        "송금 완료",
                        String.format("%s님에게 %s 송금", receiver.getName(), amountText)
                );
                userNotificationService.create(
                        receiver,
                        UserNotificationCategory.DEPOSIT,
                        "입금 확인",
                        String.format("%s님으로부터 %s 입금", sender.getName(), amountText)
                );
            } catch (Exception feedError) {
                errorLogService.logError("Notification", "알림 피드 저장 실패: " + feedError.getMessage(), ErrorLogStatus.UNRESOLVED);
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

            // AI 이상거래 탐지: 고액 송금을 관리자 검토 큐(위험 거래)에 적재한다.
            detectRisk(saved, fromAccount, toAccount, event.getAmount());

            // 시스템 로그: 송금 완료(INFO)
            systemLogger.info(LOG_SERVICE, String.format(
                    "송금 완료: TX%d #%d → #%d ₩%,d",
                    saved.getTransactionId(), fromAccount.getAccountId(),
                    toAccount.getAccountId(), event.getAmount().longValue()));

            return saved;
        } catch (FraudBlockedException e) {
            // FDS 차단: 송금 실패 처리(잔액 이동 없음). 예외를 삼켜 커밋하므로 차단 이력이 유지된다.
            transaction.setStatus(TransactionStatus.BLOCKED);
            transaction.setDescription(e.getMessage());
            transactionRepository.save(transaction);
            broadcastPipeline(transaction.getTransactionId(), fromAccount, toAccount, event.getAmount(),
                    pipelineStart, PipelineStage.RISK_CHECK, PipelineStageStatus.FAILED, e.getMessage());
            errorLogService.logError("Fraud Detection", "송금 차단(FDS): " + e.getMessage(), ErrorLogStatus.UNRESOLVED);
            systemLogger.warn(LOG_SERVICE_RISK, String.format(
                    "송금 차단(FDS): TX%d - %s", transaction.getTransactionId(), e.getMessage()));
            return transaction;
        } catch (FraudHeldException e) {
            // FDS 장애 fail-safe: 송금 일시 보류(잔액 이동 없음). 재시도/관리자 검토 대상.
            transaction.setStatus(TransactionStatus.HELD);
            transaction.setDescription(e.getMessage());
            transactionRepository.save(transaction);
            broadcastPipeline(transaction.getTransactionId(), fromAccount, toAccount, event.getAmount(),
                    pipelineStart, PipelineStage.RISK_CHECK, PipelineStageStatus.FAILED, e.getMessage());
            systemLogger.warn(LOG_SERVICE_RISK, String.format(
                    "송금 보류(FDS 장애): TX%d - %s", transaction.getTransactionId(), e.getMessage()));
            return transaction;
        } catch (CustomNotFoundException | TransferLimitExceededException | IllegalArgumentException e) {
            transaction.setStatus(TransactionStatus.FAILED);
            transaction.setDescription(e.getMessage());
            transactionRepository.save(transaction);
            // 검증 단계에서 차단(실패) 처리
            broadcastPipeline(transaction.getTransactionId(), fromAccount, toAccount, event.getAmount(),
                    pipelineStart, PipelineStage.RISK_CHECK, PipelineStageStatus.FAILED, e.getMessage());
            errorLogService.logError("Transaction Service", e.getMessage(), ErrorLogStatus.UNRESOLVED);
            // 시스템 로그: 검증 단계 차단(WARN)
            systemLogger.warn(LOG_SERVICE, String.format(
                    "송금 차단: TX%d - %s", transaction.getTransactionId(), e.getMessage()));
            return transaction;
        } catch (Exception e) {
            errorLogService.logError("Transaction Service", "알수 없는 오류 발생:" + e.getMessage(), ErrorLogStatus.UNRESOLVED);
            // 시스템 로그: 알 수 없는 오류(ERROR)
            systemLogger.error(LOG_SERVICE, String.format(
                    "송금 처리 오류: TX%d - %s", transaction.getTransactionId(), e.getMessage()));
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
