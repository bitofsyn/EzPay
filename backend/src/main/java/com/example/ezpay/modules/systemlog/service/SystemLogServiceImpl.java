package com.example.ezpay.modules.systemlog.service;

import com.example.ezpay.modules.realtime.EventBroadcaster;
import com.example.ezpay.modules.systemlog.dto.SystemLogInfo;
import com.example.ezpay.modules.systemlog.entity.SystemLog;
import com.example.ezpay.modules.systemlog.repository.SystemLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SystemLogServiceImpl implements SystemLogService {

    private static final String SSE_CHANNEL_SYSTEM_LOGS = "system-logs";

    private final SystemLogRepository systemLogRepository;
    private final EventBroadcaster eventBroadcaster;

    @Override
    @Transactional(readOnly = true)
    public List<SystemLogInfo> getRecentLogs(int limit) {
        int size = limit > 0 ? limit : 30;
        return systemLogRepository.findAllByOrderByLogTimeDesc(PageRequest.of(0, size)).stream()
                .map(SystemLogInfo::from)
                .toList();
    }

    @Override
    @Transactional
    public SystemLog save(SystemLog systemLog) {
        SystemLog saved = systemLogRepository.save(systemLog);
        eventBroadcaster.broadcastToSse(SSE_CHANNEL_SYSTEM_LOGS, SystemLogInfo.from(saved));
        return saved;
    }
}
