package com.example.ezpay.modules.admin.internal.service;

import com.example.ezpay.model.user.ErrorLog;
import com.example.ezpay.model.user.Transaction;
import com.example.ezpay.model.user.TransferLimit;
import com.example.ezpay.model.user.User;
import com.example.ezpay.modules.account.api.dto.AccountInfo;
import com.example.ezpay.modules.account.api.facade.AccountFacade;
import com.example.ezpay.modules.admin.api.dto.*;
import com.example.ezpay.shared.common.enums.TransactionStatus;
import com.example.ezpay.modules.payment.api.dto.TransactionInfo;
import com.example.ezpay.modules.payment.api.dto.TransferLimitInfo;
import com.example.ezpay.modules.payment.internal.service.TransferLimitService;
import com.example.ezpay.modules.user.api.dto.UserInfo;
import com.example.ezpay.modules.user.internal.service.UserManagementService;
import com.example.ezpay.repository.user.AccountRepository;
import com.example.ezpay.repository.user.ErrorLogRepository;
import com.example.ezpay.repository.user.TransactionRepository;
import com.example.ezpay.repository.user.UserRepository;
import com.example.ezpay.request.TransferLimitRequest;
import com.example.ezpay.service.user.ErrorLogService;
import com.example.ezpay.shared.common.enums.ErrorLogStatus;
import com.example.ezpay.shared.common.enums.Status;
import com.example.ezpay.shared.exception.CustomNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

// Admin 모듈 내부 서비스 구현 : 관리자 기능 제공
@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final ErrorLogRepository errorLogRepository;
    private final TransferLimitService transferLimitService;
    private final UserManagementService userManagementService;
    private final AccountFacade accountFacade;
    private final ErrorLogService errorLogService;

    // ========== 대시보드 ==========

    @Override
    @Transactional(readOnly = true)
    public AdminDashboardInfo getDashboardStats() {
        // 사용자 통계
        List<User> allUsers = userRepository.findAll();
        System.out.println("allUsers = " + allUsers);
        long totalUsers = allUsers.size();
        long activeUsers = allUsers.stream().filter(u -> u.getStatus() == Status.ACTIVE).count();
        long inactiveUsers = allUsers.stream().filter(u -> u.getStatus() == Status.INACTIVE).count();
        long lockedUsers = allUsers.stream().filter(u -> u.getStatus() == Status.LOCKED).count();

        // 거래 통계
        List<Transaction> allTransactions = transactionRepository.findAll();
        long totalTransactions = allTransactions.size();

        LocalDate today = LocalDate.now();
        List<Transaction> todayTransactionsList = allTransactions.stream()
                .filter(t -> t.getTransactionDate().toLocalDateTime().toLocalDate().equals(today))
                .toList();

        long todayTransactions = todayTransactionsList.size();
        BigDecimal todayVolume = todayTransactionsList.stream()
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalVolume = allTransactions.stream()
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 계좌 통계
        long totalAccounts = accountRepository.count();

        // 에러 통계
        long recentErrors = errorLogRepository.findByStatus(ErrorLogStatus.UNRESOLVED).size();

        return AdminDashboardInfo.builder()
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .inactiveUsers(inactiveUsers)
                .lockedUsers(lockedUsers)
                .totalTransactions(totalTransactions)
                .todayTransactions(todayTransactions)
                .todayTransactionVolume(todayVolume)
                .totalTransactionVolume(totalVolume)
                .totalAccounts(totalAccounts)
                .recentErrors(recentErrors)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DailyTransactionStats> getWeeklyTransactionTrend() {
        List<DailyTransactionStats> weeklyStats = new ArrayList<>();
        LocalDate today = LocalDate.now();
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("MM/dd");

        // 최근 7일 데이터 생성
        for (int i = 6; i >= 0; i--) {
            LocalDate targetDate = today.minusDays(i);
            LocalDateTime startOfDay = targetDate.atStartOfDay();
            LocalDateTime endOfDay = targetDate.atTime(LocalTime.MAX);

            List<Transaction> dayTransactions = transactionRepository.findAll().stream()
                    .filter(t -> {
                        LocalDateTime transactionTime = t.getTransactionDate().toLocalDateTime();
                        return !transactionTime.isBefore(startOfDay) && !transactionTime.isAfter(endOfDay);
                    })
                    .filter(t -> t.getStatus() == TransactionStatus.SUCCESS)
                    .collect(Collectors.toList());

            long count = dayTransactions.size();
            BigDecimal volume = dayTransactions.stream()
                    .map(Transaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            String[] days = {"일", "월", "화", "수", "목", "금", "토"};
            String dayOfWeek = days[targetDate.getDayOfWeek().getValue() % 7];

            weeklyStats.add(DailyTransactionStats.builder()
                    .date(targetDate.format(dateFormatter))
                    .dayOfWeek(dayOfWeek)
                    .transactionCount(count)
                    .totalVolume(volume)
                    .build());
        }

        return weeklyStats;
    }

    @Override
    @Transactional(readOnly = true)
    public List<HourlyTransactionStats> getTodayHourlyTransactions() {
        List<HourlyTransactionStats> hourlyStats = new ArrayList<>();
        LocalDate today = LocalDate.now();

        // 0시부터 23시까지 각 시간대별로 데이터 생성
        for (int hour = 0; hour < 24; hour++) {
            LocalDateTime startHour = today.atTime(hour, 0);
            LocalDateTime endHour = today.atTime(hour, 59, 59);

            final int currentHour = hour;
            List<Transaction> hourTransactions = transactionRepository.findAll().stream()
                    .filter(t -> {
                        LocalDateTime transactionTime = t.getTransactionDate().toLocalDateTime();
                        return !transactionTime.isBefore(startHour) && !transactionTime.isAfter(endHour);
                    })
                    .filter(t -> t.getStatus() == TransactionStatus.SUCCESS)
                    .toList();

            long count = hourTransactions.size();
            BigDecimal volume = hourTransactions.stream()
                    .map(Transaction::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            hourlyStats.add(HourlyTransactionStats.builder()
                    .hour(String.format("%02d:00", currentHour))
                    .transactionCount(count)
                    .totalVolume(volume)
                    .build());
        }

        return hourlyStats;
    }

    @Override
    @Transactional(readOnly = true)
    public List<RecentActivityLog> getRecentActivities(int limit) {
        List<RecentActivityLog> activities = new ArrayList<>();

        // 최근 거래 활동
        List<Transaction> recentTransactions = transactionRepository.findAll().stream()
                .sorted((a, b) -> b.getTransactionDate().compareTo(a.getTransactionDate()))
                .limit(limit / 2)
                .collect(Collectors.toList());

        for (Transaction tx : recentTransactions) {
            activities.add(RecentActivityLog.builder()
                    .type("transaction")
                    .description(String.format("₩%s 송금 완료", tx.getAmount().toPlainString()))
                    .timestamp(tx.getTransactionDate().toLocalDateTime())
                    .userName(tx.getSenderAccount().getUser().getName())
                    .status(tx.getStatus().toString().toLowerCase())
                    .build());
        }

        // 최근 에러 로그
        List<ErrorLog> recentErrors = errorLogRepository.findAll().stream()
                .sorted((a, b) -> b.getOccurredAt().compareTo(a.getOccurredAt()))
                .limit(limit / 4)
                .collect(Collectors.toList());

        for (ErrorLog error : recentErrors) {
            activities.add(RecentActivityLog.builder()
                    .type("error")
                    .description(error.getServiceName() + " - " + error.getErrorMessage())
                    .timestamp(error.getOccurredAt().toLocalDateTime())
                    .status(error.getStatus() == ErrorLogStatus.UNRESOLVED ? "failed" : "resolved")
                    .build());
        }

        // 시간순으로 정렬하여 최신순으로 반환
        return activities.stream()
                .sorted((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()))
                .limit(limit)
                .collect(Collectors.toList());
    }

    // ========== 사용자 관리 ==========

    @Override
    @Transactional(readOnly = true)
    public List<UserInfo> getAllUsers() {
        List<User> users = userRepository.findAll();
        return users.stream()
                .map(this::convertToUserInfo)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TransactionInfo> getAllTransactions() {
        List<Transaction> transactions = transactionRepository.findAll();
        return transactions.stream()
                .map(this::convertToTransactionInfo)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TransactionInfo> getUserTransactions(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomNotFoundException("사용자를 찾을 수 없습니다: " + userId));

        // 사용자의 모든 계좌를 조회하고, 각 계좌의 거래 내역을 수집
        return user.getAccounts().stream()
                .flatMap(account -> transactionRepository.findTransactionByAccount(account.getAccountId()).stream())
                .distinct()
                .map(this::convertToTransactionInfo)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteTransaction(Long transactionId) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new CustomNotFoundException("거래 내역을 찾을 수 없습니다: " + transactionId));

        transactionRepository.delete(transaction);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TransferLimitInfo> getAllTransferLimits() {
        List<TransferLimit> transferLimits = transferLimitService.getAllTransferLimits();
        return transferLimits.stream()
                .map(this::convertToTransferLimitInfo)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void updateUserTransferLimit(Long userId, TransferLimitRequest request) {
        transferLimitService.updateUserTransferLimit(userId, request);
    }

    @Override
    @Transactional
    public void resetUserTransferLimit(Long userId) {
        transferLimitService.resetUserTransferLimit(userId);
    }


    @Override
    @Transactional(readOnly = true)
    public UserInfo getUserById(Long userId) {
        return userManagementService.getUserById(userId);
    }

    @Override
    @Transactional
    public void updateUserStatus(Long userId, Status status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomNotFoundException("사용자를 찾을 수 없습니다: " + userId));

        user.setStatus(status);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void deleteUser(Long userId) {
        userManagementService.deleteUser(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AccountInfo> getUserAccounts(Long userId) {
        return accountFacade.getAccountsByUserId(userId);
    }

    // ========== 에러 로그 관리 ==========

    @Override
    @Transactional(readOnly = true)
    public List<ErrorLogInfo> getAllErrorLogs() {
        List<ErrorLog> errorLogs = errorLogRepository.findAll();
        return errorLogs.stream()
                .map(this::convertToErrorLogInfo)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ErrorLogInfo> getErrorLogsByStatus(ErrorLogStatus status) {
        List<ErrorLog> errorLogs = errorLogRepository.findByStatus(status);
        return errorLogs.stream()
                .map(this::convertToErrorLogInfo)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void resolveErrorLog(Long logId) {
        errorLogService.resolveErrorLog(logId);
    }

    @Override
    @Transactional
    public void deleteErrorLog(Long logId) {
        errorLogService.deleteErrorLog(logId);
    }

    // ========== Helper Methods ==========

    /**
     * User 엔티티를 UserInfo DTO로 변환
     */
    private UserInfo convertToUserInfo(User user) {
        return UserInfo.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .name(user.getName())
                .phone(user.getPhoneNumber())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toLocalDateTime() : null)
                .build();
    }

    /**
     * Transaction 엔티티를 TransactionInfo DTO로 변환
     */
    private TransactionInfo convertToTransactionInfo(Transaction transaction) {
        return TransactionInfo.builder()
                .transactionId((long) transaction.getTransactionId())
                .senderAccountId(transaction.getSenderAccount().getAccountId())
                .receiverAccountId(transaction.getReceiverAccount().getAccountId())
                .amount(transaction.getAmount())
                .memo(null) // Admin에서는 메모 정보 불필요
                .category(null) // Admin에서는 카테고리 정보 불필요
                .status(transaction.getStatus())
                .createdAt(transaction.getTransactionDate().toInstant()
                        .atZone(ZoneId.systemDefault())
                        .toLocalDateTime())
                .build();
    }

    /**
     * TransferLimit 엔티티를 TransferLimitInfo DTO로 변환
     */
    private TransferLimitInfo convertToTransferLimitInfo(TransferLimit transferLimit) {
        Long userId = transferLimit.getUserId();
        BigDecimal remainingLimit = transferLimitService.getRemainingDailyLimit(userId);
        BigDecimal usedAmount = transferLimit.getDailyLimit().subtract(remainingLimit);

        return TransferLimitInfo.builder()
                .limitId(transferLimit.getUserId())
                .userId(userId)
                .dailyLimit(transferLimit.getDailyLimit())
                .perTransactionLimit(transferLimit.getPerTransactionLimit())
                .usedAmount(usedAmount)
                .remainingAmount(remainingLimit)
                .build();
    }

    // ErrorLog 엔티티를 ErrorLogInfo DTO로 변환
    private ErrorLogInfo convertToErrorLogInfo(ErrorLog errorLog) {
        return ErrorLogInfo.builder()
                .logId(errorLog.getLogId())
                .serviceName(errorLog.getServiceName())
                .errorMessage(errorLog.getErrorMessage())
                .occurredAt(errorLog.getOccurredAt() != null ? errorLog.getOccurredAt().toLocalDateTime() : null)
                .status(errorLog.getStatus())
                .build();
    }
}
