#!/usr/bin/env bash
# EzPay 전체 스택을 빌드하고 백그라운드로 기동한다.
#   - 앱 스택        : docker-compose.yml (backend / frontend / ai-category / kafka / zookeeper / mlflow)
#   - 모니터링 스택  : docker-compose-monitoring.yml (prometheus / grafana)
#
# 사용법: ./start.sh
set -euo pipefail

# 스크립트 위치를 프로젝트 루트로 사용 (어디서 실행하든 동일하게 동작)
cd "$(dirname "$0")"

# docker compose(v2) 우선, 없으면 docker-compose(v1) 폴백
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

echo "🔨 [1/3] 앱 스택 이미지 빌드 중..."
$COMPOSE -f "$APP_COMPOSE" build

echo "🚀 [2/3] 앱 스택 기동 중 (up -d)..."
$COMPOSE -f "$APP_COMPOSE" up -d

echo "📈 [3/3] 모니터링 스택 기동 중 (up -d)..."
$COMPOSE -f "$MONITORING_COMPOSE" up -d

echo ""
echo "✅ 전체 스택이 기동되었습니다."
echo "   - Frontend    : http://localhost:3000"
echo "   - Backend     : http://localhost:8081"
echo "   - AI Category : http://localhost:8000"
echo "   - MLflow      : http://localhost:5001"
echo "   - Prometheus  : http://localhost:9090"
echo "   - Grafana     : http://localhost:3001 (admin / admin)"
echo ""
echo "상태 확인: $COMPOSE -f $APP_COMPOSE ps"
