#!/usr/bin/env bash
set -euo pipefail

readonly MAX_ATTEMPTS=30
readonly RETRY_SECONDS=5

wait_for_url() {
  local name="$1"
  local url="$2"
  local attempt

  for ((attempt = 1; attempt <= MAX_ATTEMPTS; attempt++)); do
    if curl --fail --silent --show-error --max-time 5 "$url" >/dev/null; then
      echo "✅ ${name}: ${url}"
      return 0
    fi

    echo "⏳ ${name} 응답 대기 중 (${attempt}/${MAX_ATTEMPTS})"
    sleep "$RETRY_SECONDS"
  done

  echo "❌ ${name} 헬스 체크 실패: ${url}" >&2
  docker compose ps >&2 || true
  docker compose logs --tail=100 >&2 || true
  return 1
}

wait_for_url "Frontend" "http://127.0.0.1:3000"
wait_for_url "Backend" "http://127.0.0.1:8081/health"
wait_for_url "AI Category" "http://127.0.0.1:8000/health"

ai_health="$(curl --fail --silent --show-error --max-time 5 http://127.0.0.1:8000/health)"
if ! grep -Eq '"ready"[[:space:]]*:[[:space:]]*true' <<<"$ai_health"; then
  echo "❌ AI Category 모델이 준비되지 않았습니다: ${ai_health}" >&2
  docker compose logs --tail=100 ai-category >&2 || true
  exit 1
fi
echo "✅ AI Category 모델 로드 확인"

echo "✅ EzPay 로컬 배포 헬스 체크가 완료되었습니다."
