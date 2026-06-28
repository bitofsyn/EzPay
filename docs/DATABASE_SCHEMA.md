# EzPay 데이터베이스 스키마

**작성일:** 2026-06-28  
**DBMS:** PostgreSQL 13+

---

## 📋 테이블 목록

1. [users](#users-사용자) - 사용자 기본 정보
2. [accounts](#accounts-계좌) - 계좌 정보
3. [transactions](#transactions-거래) - 거래 내역
4. [risk_transactions](#risk_transactions-위험거래) - AI 위험 거래 감지
5. [system_logs](#system_logs-시스템로그) - 시스템 로그
6. [admin_alerts](#admin_alerts-관리자알림) - 관리자 알림
7. [admin_messages](#admin_messages-관리자메시지) - 관리자 메시지

---

## users 사용자

```sql
CREATE TABLE users (
    user_id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'LOCKED')),
    role VARCHAR(20) NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN', 'SUPER_ADMIN')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    CONSTRAINT email_format CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);
```

---

## accounts 계좌

```sql
CREATE TABLE accounts (
    account_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    bank_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(50) UNIQUE NOT NULL,
    account_holder VARCHAR(100) NOT NULL,
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
    is_main BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    CONSTRAINT unique_main_per_user UNIQUE (user_id, is_main) WHERE is_main = TRUE
);

CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_bank_account ON accounts(bank_name, account_number);
CREATE INDEX idx_accounts_status ON accounts(status);
```

---

## transactions 거래

```sql
CREATE TABLE transactions (
    transaction_id BIGSERIAL PRIMARY KEY,
    sender_account_id BIGINT NOT NULL REFERENCES accounts(account_id),
    receiver_account_id BIGINT NOT NULL REFERENCES accounts(account_id),
    amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('SUCCESS', 'PENDING', 'FAILED', 'CANCELLED')),
    description VARCHAR(500),
    memo VARCHAR(500),
    category VARCHAR(50),
    fee DECIMAL(10, 2) DEFAULT 0,
    estimated_completion_at TIMESTAMP,
    completed_at TIMESTAMP,
    transaction_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT different_accounts CHECK (sender_account_id != receiver_account_id)
);

CREATE INDEX idx_transactions_sender ON transactions(sender_account_id);
CREATE INDEX idx_transactions_receiver ON transactions(receiver_account_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
```

---

## risk_transactions 위험거래

```sql
CREATE TABLE risk_transactions (
    risk_id BIGSERIAL PRIMARY KEY,
    transaction_id BIGINT NOT NULL REFERENCES transactions(transaction_id) ON DELETE CASCADE,
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('DANGER', 'CAUTION', 'SAFE')),
    risk_score NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    reason TEXT NOT NULL,
    detected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by BIGINT REFERENCES users(user_id),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING_REVIEW' CHECK (status IN ('PENDING_REVIEW', 'APPROVED', 'BLOCKED')),
    review_comment TEXT,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_risk_transactions_risk_level ON risk_transactions(risk_level);
CREATE INDEX idx_risk_transactions_status ON risk_transactions(status);
CREATE INDEX idx_risk_transactions_detected_at ON risk_transactions(detected_at);
CREATE INDEX idx_risk_transactions_reviewed_by ON risk_transactions(reviewed_by);
```

---

## system_logs 시스템로그

```sql
CREATE TABLE system_logs (
    log_id BIGSERIAL PRIMARY KEY,
    level VARCHAR(20) NOT NULL CHECK (level IN ('INFO', 'WARN', 'ERROR', 'DEBUG')),
    service VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    request_id VARCHAR(100),
    user_id BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
    duration_ms INTEGER,
    status_code INTEGER,
    stack_trace TEXT,
    metadata JSONB,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_system_logs_level ON system_logs(level);
CREATE INDEX idx_system_logs_service ON system_logs(service);
CREATE INDEX idx_system_logs_timestamp ON system_logs(timestamp);
CREATE INDEX idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX idx_system_logs_request_id ON system_logs(request_id);

-- 파티셔닝 (월별)
-- SELECT create_hypertable('system_logs', 'timestamp');
```

---

## admin_alerts 관리자알림

```sql
CREATE TABLE admin_alerts (
    alert_id BIGSERIAL PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('warning', 'info', 'error', 'success')),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    related_transaction_id BIGINT REFERENCES transactions(transaction_id) ON DELETE SET NULL,
    related_user_id BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days')
);

CREATE INDEX idx_admin_alerts_alert_type ON admin_alerts(alert_type);
CREATE INDEX idx_admin_alerts_is_read ON admin_alerts(is_read);
CREATE INDEX idx_admin_alerts_created_at ON admin_alerts(created_at);
CREATE INDEX idx_admin_alerts_expires_at ON admin_alerts(expires_at);
```

---

## admin_messages 관리자메시지

```sql
CREATE TABLE admin_messages (
    message_id BIGSERIAL PRIMARY KEY,
    sender_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    sender_name VARCHAR(100) NOT NULL,
    sender_avatar VARCHAR(500),
    subject VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('risk', 'support', 'system', 'general')),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP,
    related_transaction_id BIGINT REFERENCES transactions(transaction_id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admin_messages_sender_id ON admin_messages(sender_id);
CREATE INDEX idx_admin_messages_category ON admin_messages(category);
CREATE INDEX idx_admin_messages_is_read ON admin_messages(is_read);
CREATE INDEX idx_admin_messages_created_at ON admin_messages(created_at);
```

---

## 초기화 스크립트

```sql
-- 관리자 사용자 생성
INSERT INTO users (email, name, phone_number, password_hash, status, role)
VALUES ('admin@ezpay.com', '관리자', '010-0000-0000', '$2a$10$...', 'ACTIVE', 'ADMIN');

-- 기본 계좌 생성 (테스트용)
INSERT INTO accounts (user_id, bank_name, account_number, account_holder, balance, is_main, status)
SELECT user_id, 'EzBank', '1000000001', name, 10000000, true, 'ACTIVE'
FROM users WHERE role = 'ADMIN';

-- 인덱스 통계 업데이트
ANALYZE;
```

---

## 주요 쿼리

### 1. 위험 거래 조회 (관리자용)

```sql
SELECT 
    t.transaction_id,
    t.amount,
    t.status,
    t.transaction_date,
    sa.account_number as sender_account,
    sa.bank_name as sender_bank,
    ra.account_number as receiver_account,
    ra.bank_name as receiver_bank,
    rt.risk_level,
    rt.risk_score,
    rt.reason,
    rt.reviewed_by,
    rt.review_comment
FROM transactions t
JOIN accounts sa ON t.sender_account_id = sa.account_id
JOIN accounts ra ON t.receiver_account_id = ra.account_id
LEFT JOIN risk_transactions rt ON t.transaction_id = rt.transaction_id
WHERE rt.risk_level IS NOT NULL
ORDER BY rt.detected_at DESC
LIMIT 100;
```

### 2. 일일 거래량 통계

```sql
SELECT 
    DATE_TRUNC('hour', transaction_date)::DATE as date,
    EXTRACT(HOUR FROM transaction_date)::INTEGER as hour,
    COUNT(*) as transaction_count,
    SUM(amount) as total_volume,
    COUNT(CASE WHEN status = 'SUCCESS' THEN 1 END) as success_count,
    COUNT(CASE WHEN status = 'FAILED' THEN 1 END) as failed_count
FROM transactions
WHERE transaction_date >= CURRENT_DATE
GROUP BY date, hour
ORDER BY date DESC, hour DESC;
```

### 3. 사용자별 거래량

```sql
SELECT 
    u.user_id,
    u.name,
    COUNT(DISTINCT t.transaction_id) as transaction_count,
    SUM(t.amount) as total_amount,
    MAX(t.transaction_date) as last_transaction_date
FROM users u
LEFT JOIN accounts a ON u.user_id = a.user_id
LEFT JOIN transactions t ON a.account_id = t.sender_account_id
WHERE u.deleted_at IS NULL
GROUP BY u.user_id, u.name
ORDER BY total_amount DESC NULLS LAST;
```

### 4. 시스템 로그 검색

```sql
SELECT 
    log_id,
    level,
    service,
    message,
    timestamp,
    request_id,
    duration_ms
FROM system_logs
WHERE 
    level IN ('ERROR', 'WARN')
    AND timestamp >= NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC
LIMIT 100;
```

---

## 마이그레이션 전략

### 초기 배포 (V1)
```sql
-- schema.sql 전체 실행
psql -h localhost -U ezpay_user -d ezpay < schema.sql
```

### 데이터 백업
```bash
pg_dump -h localhost -U ezpay_user -d ezpay > backup.sql
```

### 스키마 버전 관리
```sql
CREATE TABLE schema_versions (
    id SERIAL PRIMARY KEY,
    version VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO schema_versions (version, description) VALUES ('1.0', 'Initial schema');
```

---

## 성능 최적화

### 1. 파티셔닝
```sql
-- 월별 파티셔닝 (system_logs)
SELECT create_hypertable('system_logs', 'timestamp', 
    if_not_exists => TRUE);
```

### 2. 통계 유지
```sql
-- 매일 자동 분석
CREATE OR REPLACE FUNCTION analyze_tables()
RETURNS void AS $$
BEGIN
    ANALYZE users;
    ANALYZE accounts;
    ANALYZE transactions;
    ANALYZE risk_transactions;
    ANALYZE system_logs;
    ANALYZE admin_alerts;
    ANALYZE admin_messages;
END;
$$ LANGUAGE plpgsql;

-- Cron Job 설정 (pg_cron 확장)
SELECT cron.schedule('analyze-tables', '0 2 * * *', 
    'SELECT analyze_tables()');
```

### 3. 자동 Vacuum
```sql
ALTER TABLE transactions SET (
    autovacuum_vacuum_scale_factor = 0.01,
    autovacuum_analyze_scale_factor = 0.005
);
```

---

## 백업 및 복구

### 자동 백업 설정
```bash
#!/bin/bash
BACKUP_DIR="/backups/ezpay"
DB_NAME="ezpay"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Full backup
pg_dump -h localhost -U ezpay_user -d $DB_NAME \
    | gzip > $BACKUP_DIR/full_$DATE.sql.gz

# Retention: 30일
find $BACKUP_DIR -name "full_*.sql.gz" -mtime +30 -delete
```

---

**마지막 업데이트:** 2026-06-28
