#!/usr/bin/env bash
# 개선 전/후 jar 를 같은 조건에서 번갈아 측정한다.
#   ./bench.sh baseline .jars/app-baseline.jar
#   ./bench.sh improved .jars/app-improved.jar
# 매 실행마다 인프라(Postgres·Kafka)를 새로 만들어 토픽 파티션·데이터가 이전 실행에 영향받지 않게 한다.
set -euo pipefail
cd "$(dirname "$0")"
NAME=$1; JAR=$(cd "$(dirname "$2")" && pwd)/$(basename "$2")
LOG=results/$NAME.backend.log
SCENARIOS=${SCENARIOS:-"local db5ms smtp burst"}
mkdir -p results

docker compose -f docker-compose.loadtest.yml down -v >/dev/null 2>&1 || true
docker compose -f docker-compose.loadtest.yml up -d --wait >/dev/null
./toxics.sh >/dev/null

JAR="$JAR" ./run-backend.sh >"$LOG" 2>&1 &
BACKEND_PID=$!
trap 'kill $BACKEND_PID 2>/dev/null || true; wait $BACKEND_PID 2>/dev/null || true' EXIT

# 송금 컨슈머가 파티션을 배정받은 뒤에 측정을 시작한다(개선 전 버전은 그 전에 들어온 메시지를 건너뛴다).
for _ in $(seq 1 120); do grep -q "ezpay-group: partitions assigned" "$LOG" && break; sleep 1; done
grep -q "ezpay-group: partitions assigned" "$LOG" || { echo "backend not ready" >&2; exit 1; }

EMAIL_NOTIFY=false ./seed.sh >/dev/null
for s in $SCENARIOS; do
  case $s in
    # 로컬 DB(지연 없음): 컨슈머 구조 자체의 천장
    local)  DB_LATENCY_MS=0 SMTP_LATENCY_MS=0 ./toxics.sh; EMAIL_NOTIFY=false ./seed.sh >/dev/null
            LABEL=$NAME-local RATE=${LOCAL_RATE:-600} DURATION=30s ./measure.sh ;;
    # DB 왕복 +5ms: 같은 리전 관리형 DB 수준의 네트워크 지연
    db5ms)  DB_LATENCY_MS=5 SMTP_LATENCY_MS=0 ./toxics.sh; EMAIL_NOTIFY=false ./seed.sh >/dev/null
            LABEL=$NAME-db5ms RATE=${DB5_RATE:-100} DURATION=20s ./measure.sh ;;
    # 송금 완료 메일 ON + SMTP 왕복 +100ms (외부 메일 서버 수준)
    smtp)   DB_LATENCY_MS=0 SMTP_LATENCY_MS=100 ./toxics.sh; EMAIL_NOTIFY=true ./seed.sh >/dev/null
            LABEL=$NAME-smtp RATE=${SMTP_RATE:-20} DURATION=10s ./measure.sh ;;
    # 제출 경로 스트레스: 동시 사용자 200명이 60초간 쉬지 않고 송금 제출
    burst)  DB_LATENCY_MS=0 SMTP_LATENCY_MS=0 ./toxics.sh; EMAIL_NOTIFY=false ./seed.sh >/dev/null
            LABEL=$NAME-burst VUS=${BURST_VUS:-200} DURATION=60s ./measure.sh ;;
  esac
done
