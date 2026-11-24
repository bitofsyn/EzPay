#!/usr/bin/env bash
# 송금 파이프라인 end-to-end 처리량 측정.
#   LABEL=baseline RATE=50 DURATION=30s ./measure.sh      (고정 도착률)
#   LABEL=burst VUS=100 DURATION=60s ./measure.sh          (동시 사용자 100명 지속 제출)
# 1) 이전 측정 데이터 초기화  2) k6 로 고정 도착률 제출  3) 제출된 건이 모두 최종 상태가 될 때까지 DB 폴링
# 4) 제출 지연·E2E 처리량·정합성(잔액 합 보존, 음수 잔액)을 results/<LABEL>.json 에 기록
set -euo pipefail
cd "$(dirname "$0")"
LABEL=${LABEL:-run}
RATE=${RATE:-50}
DURATION=${DURATION:-30s}
DRAIN_TIMEOUT=${DRAIN_TIMEOUT:-600}
BASE_URL=${BASE_URL:-http://localhost:18081}
mkdir -p results
q() { docker compose -f docker-compose.loadtest.yml exec -T postgres psql -U ezpay -d ezpay -qtA -c "$1"; }

q "TRUNCATE transactions, risk_transactions, user_notifications, email_deliveries, system_logs,
           error_logs, failed_event_log, admin_alerts RESTART IDENTITY CASCADE"
q "UPDATE accounts SET balance = 1e12 WHERE bank_name = 'LoadTestBank'"
read -r MIN_ID MAX_ID < <(q "SELECT min(account_id) || ' ' || max(account_id) FROM accounts WHERE bank_name='LoadTestBank'")
BALANCE_BEFORE=$(q "SELECT sum(balance) FROM accounts WHERE bank_name='LoadTestBank'")

START=$(python3 -c 'import time;print(time.time())')
BASE_URL=$BASE_URL RATE=$RATE VUS=${VUS:-0} DURATION=$DURATION MIN_ACCOUNT_ID=$MIN_ID MAX_ACCOUNT_ID=$MAX_ID \
  SUMMARY_OUT="results/$LABEL.k6.json" k6 run -q transfer.js >/dev/null
SUBMIT_END=$(python3 -c 'import time;print(time.time())')
ACCEPTED=$(python3 -c "import json;print(json.load(open('results/$LABEL.k6.json'))['metrics']['checks']['values']['passes'])")

# 모든 접수 건이 최종 상태(PROCESSING 이 아닌 상태)가 될 때까지 대기
last=-1; stall=0
while :; do
  done_cnt=$(q "SELECT count(*) FROM transactions WHERE status <> 'PROCESSING'")
  now=$(python3 -c 'import time;print(time.time())')
  [ "$done_cnt" -ge "$ACCEPTED" ] && break
  if [ "$done_cnt" = "$last" ]; then stall=$((stall+1)); else stall=0; fi
  last=$done_cnt
  if [ "$stall" -ge 60 ] || python3 -c "import sys;sys.exit(0 if $now-$START>$DRAIN_TIMEOUT else 1)"; then
    echo "drain stalled/timed out at $done_cnt/$ACCEPTED" >&2; break
  fi
  sleep 1
done
END=$(python3 -c 'import time;print(time.time())')

STATUS=$(q "SELECT coalesce(json_object_agg(status, c), '{}') FROM (SELECT status, count(*) c FROM transactions GROUP BY status) s")
SPAN=$(q "SELECT extract(epoch FROM max(transaction_date) - min(transaction_date)) FROM transactions")
BALANCE_AFTER=$(q "SELECT sum(balance) FROM accounts WHERE bank_name='LoadTestBank'")
NEGATIVE=$(q "SELECT count(*) FROM accounts WHERE balance < 0")

python3 - "$LABEL" "$RATE" "$DURATION" "$ACCEPTED" "$START" "$SUBMIT_END" "$END" "$STATUS" "$SPAN" \
         "$BALANCE_BEFORE" "$BALANCE_AFTER" "$NEGATIVE" <<'PY'
import json, sys
label, rate, duration, accepted, start, submit_end, end, status, span, bb, ba, neg = sys.argv[1:]
k6 = json.load(open(f"results/{label}.k6.json"))["metrics"]
dur = k6["http_req_duration{name:transfer}"]["values"] if "http_req_duration{name:transfer}" in k6 else k6["http_req_duration"]["values"]
status = json.loads(status)
processed = sum(status.values())
start, submit_end, end = float(start), float(submit_end), float(end)
res = {
    "label": label, "target_rate": int(rate), "vus": int(__import__("os").environ.get("VUS") or 0), "duration": duration,
    "submitted": int(k6["http_reqs"]["values"]["count"]) - 1,  # setup 로그인 1건 제외
    "accepted": int(accepted),
    "submit_error_rate": round(1 - int(accepted) / max(1, int(k6["http_reqs"]["values"]["count"]) - 1), 4),
    "submit_rps": round((int(k6["http_reqs"]["values"]["count"]) - 1) / (submit_end - start), 1),
    "submit_latency_ms": {k: round(v, 1) for k, v in dur.items()},
    "processed": processed, "status": status,
    "e2e_seconds": round(end - start, 1),
    "drain_after_submit_seconds": round(end - submit_end, 1),
    "e2e_tps": round(processed / (end - start), 1),
    "processing_tps": round(processed / float(span), 1) if span and float(span) > 0 else None,
    "balance_conserved": bb == ba, "negative_balances": int(neg),
}
json.dump(res, open(f"results/{label}.json", "w"), indent=2, ensure_ascii=False)
print(json.dumps(res, ensure_ascii=False))
PY
