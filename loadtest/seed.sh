#!/usr/bin/env bash
# 부하테스트 데이터 준비: 드라이버 유저 1명 + 계좌 N개(기본 2,000) + 넉넉한 한도/잔액.
# EMAIL_NOTIFY=true 로 주면 송금 완료 메일 경로까지 포함해 측정한다.
set -euo pipefail
cd "$(dirname "$0")"
BASE_URL=${BASE_URL:-http://localhost:18081}
ACCOUNTS=${ACCOUNTS:-2000}
EMAIL=loadtest-driver@ezpay.test
PASSWORD='LoadTest!2345'   # 로컬 부하테스트 전용 테스트 계정
PSQL=(docker compose -f docker-compose.loadtest.yml exec -T postgres psql -U ezpay -d ezpay -v ON_ERROR_STOP=1 -qtA)

curl -s -o /dev/null -X POST "$BASE_URL/users/signup" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"name\":\"LoadDriver\"}" || true

"${PSQL[@]}" <<SQL
-- 기본 측정은 Kafka 파이프라인 자체를 보기 위해 이메일 알림을 끈다(SMTP 영향은 EMAIL=on 으로 별도 측정).
UPDATE notifications SET is_enabled = ${EMAIL_NOTIFY:-false}
 WHERE notification_type = 'EMAIL' AND user_id = (SELECT user_id FROM users WHERE email = '$EMAIL');
UPDATE transfer_limits SET daily_limit = 1e15, per_transaction_limit = 1e12
 WHERE user_id = (SELECT user_id FROM users WHERE email = '$EMAIL');
INSERT INTO accounts (balance, is_main, created_at, updated_at, user_id, account_number, bank_name)
SELECT 1e12, false, now(), now(), u.user_id, 'LT-' || lpad(g::text, 6, '0'), 'LoadTestBank'
  FROM users u, generate_series(1, $ACCOUNTS) g
 WHERE u.email = '$EMAIL'
ON CONFLICT (account_number) DO NOTHING;
SQL
"${PSQL[@]}" -c "SELECT min(account_id) || ' ' || max(account_id) FROM accounts WHERE bank_name='LoadTestBank'"
