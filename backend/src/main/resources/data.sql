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

-- 초기 알림 데이터
INSERT INTO admin_alerts (alert_type, title, message, is_read, created_at)
SELECT 'WARNING', '비정상 거래 감지', '사용자 ID 12345의 대량 거래가 감지되었습니다. 확인이 필요합니다.', false, CURRENT_TIMESTAMP - INTERVAL '5 minutes'
WHERE NOT EXISTS (SELECT 1 FROM admin_alerts WHERE title = '비정상 거래 감지');

INSERT INTO admin_alerts (alert_type, title, message, is_read, created_at)
SELECT 'INFO', '시스템 업데이트', '새로운 보안 패치가 적용되었습니다. 버전 2.1.0', false, CURRENT_TIMESTAMP - INTERVAL '30 minutes'
WHERE NOT EXISTS (SELECT 1 FROM admin_alerts WHERE title = '시스템 업데이트');

INSERT INTO admin_alerts (alert_type, title, message, is_read, created_at)
SELECT 'SUCCESS', '백업 완료', '일일 데이터 백업이 성공적으로 완료되었습니다.', true, CURRENT_TIMESTAMP - INTERVAL '1 hour'
WHERE NOT EXISTS (SELECT 1 FROM admin_alerts WHERE title = '백업 완료');

INSERT INTO admin_alerts (alert_type, title, message, is_read, created_at)
SELECT 'ERROR', '서버 오류', 'API 서버 응답 지연이 발생했습니다. 모니터링 중입니다.', true, CURRENT_TIMESTAMP - INTERVAL '2 hours'
WHERE NOT EXISTS (SELECT 1 FROM admin_alerts WHERE title = '서버 오류');

INSERT INTO admin_alerts (alert_type, title, message, is_read, created_at)
SELECT 'WARNING', '로그인 시도 초과', '사용자 test@example.com의 로그인 시도가 5회 초과되었습니다.', false, CURRENT_TIMESTAMP - INTERVAL '15 minutes'
WHERE NOT EXISTS (SELECT 1 FROM admin_alerts WHERE title = '로그인 시도 초과');

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
