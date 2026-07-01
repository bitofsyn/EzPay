package com.example.ezpay.modules.systemlog.service;

import com.example.ezpay.modules.systemlog.dto.SystemLogInfo;
import com.example.ezpay.modules.systemlog.entity.SystemLog;

import java.util.List;

public interface SystemLogService {

    List<SystemLogInfo> getRecentLogs(int limit);

    SystemLog save(SystemLog systemLog);
}
