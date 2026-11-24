#!/usr/bin/env bash
# 부하테스트용 로컬 인프라(docker-compose.loadtest.yml)에 붙여 백엔드를 실행한다.
# backend/.env 의 값보다 여기서 지정한 환경변수가 우선한다(운영 DB/브로커로 새지 않도록).
set -euo pipefail
cd "$(dirname "$0")/../backend"

# JAR 를 지정하면 그 빌드를 실행한다(예: 개선 전 jar 와 비교 측정).
JAR=${JAR:-$(ls build/libs/*.jar | grep -v plain | head -1)}

export SPRING_PROFILES_ACTIVE=prod
export PORT=${PORT:-18081}
export DATABASE_URL="jdbc:postgresql://localhost:55433/ezpay"
export SPRING_DATASOURCE_URL="$DATABASE_URL"
export DB_USERNAME=ezpay SPRING_DATASOURCE_USERNAME=ezpay
export DB_PASSWORD=ezpay SPRING_DATASOURCE_PASSWORD=ezpay
export SPRING_KAFKA_BOOTSTRAP_SERVERS=localhost:59092
export SPRING_KAFKA_LISTENER_AUTO_STARTUP=true
export EZPAY_KAFKA_ENABLED=true
export MANAGEMENT_ENDPOINTS_INCLUDE=health,info,prometheus
# DB·SMTP 는 toxiproxy(toxics.sh) 를 거쳐 접속한다. SMTP 는 로컬 mailpit 이라 실제 메일은 나가지 않는다.
export SPRING_MAIL_HOST=localhost SPRING_MAIL_PORT=51025
export SMTP_USERNAME=loadtest SMTP_PASSWORD=loadtest
export MANAGEMENT_HEALTH_MAIL_ENABLED=false

# 송금 1건당 비용(FDS 룰 평가 포함)은 그대로 측정하되, 같은 계좌의 반복 송금이 velocity 룰에 걸려
# 보류되지 않도록 임계치만 올린다.
exec java -Xms1g -Xmx1g -Dezpay.fds.velocity.max-count=1000000 ${JAVA_OPTS:-} -jar "$JAR"
