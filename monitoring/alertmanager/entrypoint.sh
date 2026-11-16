#!/bin/sh
# ─────────────────────────────────────────────────────────────────────────────
# Alertmanager 기동 스크립트
#
# Alertmanager 는 설정 파일에서 환경변수를 치환하지 못하므로, 컨테이너 시작 시점에
# 환경변수로부터 설정 파일을 생성한다. 자격 증명은 저장소에 남기지 않는다.
#
#   SMTP_USERNAME / SMTP_PASSWORD  : 발송 계정 (백엔드와 동일한 값 재사용)
#   ALERT_EMAIL_TO                 : 수신 주소. 미설정 시 ADMIN_ALERT_EMAIL → SMTP_USERNAME 순으로 대체
#   SMTP_HOST / SMTP_PORT          : 기본 smtp.gmail.com:587
#
# SMTP 값이 없으면 알림을 보내지 않는 수신자(none)로 기동한다. 이때 경보는 UI 에서만 확인한다.
# ─────────────────────────────────────────────────────────────────────────────
set -eu

CONFIG=/tmp/alertmanager.yml
PASSWORD_FILE=/tmp/smtp_password
EMAIL_TO="${ALERT_EMAIL_TO:-${ADMIN_ALERT_EMAIL:-${SMTP_USERNAME:-}}}"

# 설정 파일 상단: 라우팅·억제 규칙은 이메일 사용 여부와 무관하게 동일하다.
write_common() {
  cat <<EOF
route:
  receiver: $1
  group_by: [alertname, job]
  group_wait: 30s        # 같은 그룹의 경보를 모아 한 통으로 보낸다
  group_interval: 5m
  repeat_interval: 4h    # 해소되지 않은 경보의 재알림 주기

# 서비스가 내려가면(TargetDown) 같은 job 의 warning 경보는 원인이 같으므로 묵음 처리한다.
inhibit_rules:
  - source_matchers: [alertname="TargetDown"]
    target_matchers: [severity="warning"]
    equal: [job]

EOF
}

if [ -n "${SMTP_USERNAME:-}" ] && [ -n "${SMTP_PASSWORD:-}" ] && [ -n "$EMAIL_TO" ]; then
  umask 077
  printf '%s' "$SMTP_PASSWORD" > "$PASSWORD_FILE"
  {
    cat <<EOF
global:
  resolve_timeout: 5m
  smtp_smarthost: '${SMTP_HOST:-smtp.gmail.com}:${SMTP_PORT:-587}'
  smtp_from: '${ALERT_EMAIL_FROM:-$SMTP_USERNAME}'
  smtp_auth_username: '$SMTP_USERNAME'
  smtp_auth_password_file: $PASSWORD_FILE
  smtp_require_tls: true

EOF
    write_common email
    cat <<EOF
receivers:
  - name: email
    email_configs:
      - to: '$EMAIL_TO'
        send_resolved: true
        headers:
          subject: '[EzPay] {{ .Status | toUpper }} · {{ .CommonLabels.alertname }} ({{ len .Alerts }}건)'
EOF
  } > "$CONFIG"
  echo "alertmanager: 이메일 알림 활성화 (수신: $EMAIL_TO)"
else
  {
    echo "global:"
    echo "  resolve_timeout: 5m"
    echo
    write_common none
    printf 'receivers:\n  - name: none\n'
  } > "$CONFIG"
  echo "alertmanager: SMTP 설정이 없어 알림 발송 없이 기동합니다 (경보는 UI 에서만 확인)."
fi

exec /bin/alertmanager \
  --config.file="$CONFIG" \
  --storage.path=/alertmanager \
  "$@"
