#!/usr/bin/env bash
# EzPay 전체 스택을 중지한다.
#   - 모니터링 스택 (docker-compose-monitoring.yml)
#   - 앱 스택        (docker-compose.yml)
#
# 사용법:
#   ./stop.sh          # 컨테이너/네트워크 중지·제거 (데이터 볼륨은 보존)
#   ./stop.sh -v       # 볼륨까지 함께 제거 (DB/Kafka/Jenkins 데이터 삭제)
set -euo pipefail

cd "$(dirname "$0")"

if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  echo "❌ docker compose 를 찾을 수 없습니다. Docker Desktop 이 실행 중인지 확인하세요." >&2
  exit 1
fi

APP_COMPOSE="docker-compose.yml"
MONITORING_COMPOSE="docker-compose-monitoring.yml"

# -v 옵션이 있으면 볼륨까지 제거
DOWN_ARGS=""
if [[ "${1:-}" == "-v" || "${1:-}" == "--volumes" ]]; then
  DOWN_ARGS="--volumes"
  echo "⚠️  볼륨까지 삭제합니다 (DB/Kafka/Jenkins 데이터가 사라집니다)."
fi

echo "🧹 [1/2] 모니터링 스택 중지 중..."
$COMPOSE -f "$MONITORING_COMPOSE" down $DOWN_ARGS

echo "🧹 [2/2] 앱 스택 중지 중..."
$COMPOSE -f "$APP_COMPOSE" down $DOWN_ARGS

echo ""
echo "✅ 전체 스택이 중지되었습니다."
