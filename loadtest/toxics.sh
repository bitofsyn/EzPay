#!/usr/bin/env bash
# toxiproxy 프록시를 만들고 지연을 설정한다.
#   DB_LATENCY_MS=5 SMTP_LATENCY_MS=300 ./toxics.sh
# 지연은 응답 방향(downstream)에 걸리므로 요청-응답 왕복마다 약 N ms 가 더해진다.
set -euo pipefail
API=http://localhost:8474
DB_LATENCY_MS=${DB_LATENCY_MS:-0}
SMTP_LATENCY_MS=${SMTP_LATENCY_MS:-0}

ensure_proxy() { # name listen upstream
  curl -sf "$API/proxies/$1" >/dev/null 2>&1 || \
    curl -sf -X POST "$API/proxies" -d "{\"name\":\"$1\",\"listen\":\"0.0.0.0:$2\",\"upstream\":\"$3\"}" >/dev/null
}
set_latency() { # name ms
  curl -s -X DELETE "$API/proxies/$1/toxics/latency" >/dev/null || true
  if [ "$2" -gt 0 ]; then
    curl -sf -X POST "$API/proxies/$1/toxics" \
      -d "{\"name\":\"latency\",\"type\":\"latency\",\"stream\":\"downstream\",\"attributes\":{\"latency\":$2}}" >/dev/null
  fi
}

ensure_proxy postgres 55433 postgres:5432
ensure_proxy smtp 51025 mailpit:1025
set_latency postgres "$DB_LATENCY_MS"
set_latency smtp "$SMTP_LATENCY_MS"
echo "toxics: db=${DB_LATENCY_MS}ms smtp=${SMTP_LATENCY_MS}ms"
