-- =============================================
-- 로컬 개발용 관리자 계정 초기화
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
