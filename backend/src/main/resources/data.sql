-- =============================================
-- 스키마 마이그레이션 (새 컬럼 추가)
-- =============================================

-- users 테이블에 role 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(255);
UPDATE users SET role = 'USER' WHERE role IS NULL;
ALTER TABLE users ALTER COLUMN role SET NOT NULL;

-- accounts 테이블에 updated_at 컬럼 추가
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;

-- transactions 테이블에 category, memo 컬럼 추가
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS category VARCHAR(255);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS memo VARCHAR(255);

-- training_data 테이블에 user_id 컬럼 추가 (nullable로 먼저 추가)
ALTER TABLE training_data ADD COLUMN IF NOT EXISTS user_id BIGINT;

-- =============================================
-- 관리자 계정 초기화
-- 비밀번호: admin123! (BCrypt 암호화)
-- =============================================
INSERT INTO users (email, password, name, phone_number, status, role, created_at, updated_at)
SELECT 'admin@ezpay.com',
       '$2a$10$8K1p/a0dR1xmUH1pXZq5/.Z3F6UjmrOH5gZ5/V7VjBvSKJIpqzq2a',
       '관리자',
       '010-0000-0000',
       'ACTIVE',
       'ADMIN',
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@ezpay.com');

-- =============================================
-- 관리자 알림 테이블 생성 및 초기 데이터
-- =============================================
CREATE TABLE IF NOT EXISTS admin_alerts (
    alert_id BIGSERIAL PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message VARCHAR(500) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- (초기 알림 목업 데이터 제거됨: 실제 알림은 시스템 이벤트로 생성)

-- =============================================
-- 관리자 메시지 테이블 생성 및 초기 데이터
-- =============================================
CREATE TABLE IF NOT EXISTS admin_messages (
    message_id BIGSERIAL PRIMARY KEY,
    sender_id BIGINT NOT NULL,
    subject VARCHAR(255) NOT NULL,
    content VARCHAR(1000) NOT NULL,
    category VARCHAR(50) DEFAULT 'GENERAL',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(user_id)
);
