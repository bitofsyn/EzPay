# 송금 파이프라인 부하테스트

송금 API 제출부터 Kafka 컨슈머가 원장에 기록할 때까지의 **end-to-end 처리량**을 재현 가능하게 측정한다.
운영 DB·브로커를 쓰지 않고 이 폴더의 로컬 인프라만 사용한다. 결과 해석은 [docs/performance.md](../docs/performance.md) 참고.

## 구성

| 파일 | 역할 |
|---|---|
| `docker-compose.loadtest.yml` | Postgres(tmpfs) · Kafka 단일 브로커 · toxiproxy(지연 주입) · mailpit(로컬 SMTP) |
| `toxics.sh` | DB / SMTP 왕복 지연 설정 (`DB_LATENCY_MS`, `SMTP_LATENCY_MS`) |
| `run-backend.sh` | 백엔드 jar 를 로컬 인프라에 붙여 18081 포트로 실행 (`JAR=` 로 빌드 지정) |
| `seed.sh` | 드라이버 유저 1명 + 계좌 2,000개, 한도·잔액 넉넉히 (`EMAIL_NOTIFY=true` 면 송금 메일 ON) |
| `transfer.js` | k6 스크립트. 고정 도착률(`RATE`) 또는 동시 사용자(`VUS`) 모델 |
| `measure.sh` | 초기화 → 제출 → 모든 건이 최종 상태가 될 때까지 DB 폴링 → `results/<LABEL>.json` |
| `bench.sh` | 인프라를 새로 만들고 시나리오 4종(local · db5ms · smtp · burst)을 연속 측정 |

## 실행

```bash
# 개선 전/후 jar 준비 (예: 개선 전 커밋에서 빌드한 jar 를 .jars/app-baseline.jar 로 복사)
(cd ../backend && ./gradlew bootJar -x test) && mkdir -p .jars && cp ../backend/build/libs/app.jar .jars/app-improved.jar

./bench.sh improved .jars/app-improved.jar
./bench.sh baseline .jars/app-baseline.jar
```

특정 시나리오만: `SCENARIOS="local burst" ./bench.sh improved .jars/app-improved.jar`

## 지표

- `e2e_tps`: 처리 완료 건수 ÷ (제출 시작 ~ 마지막 건 처리 완료) 시간
- `processing_tps`: 처리 완료 건수 ÷ 첫 건~마지막 건 원장 기록 시각 간격 (컨슈머 실처리 속도)
- `drain_after_submit_seconds`: 제출이 끝난 뒤 밀린 건을 다 처리하기까지 걸린 시간 (Kafka lag 해소 시간)
- `submit_latency_ms`, `submit_error_rate`: 송금 API(202 응답) 지연과 실패율
- `balance_conserved`, `negative_balances`: 전체 잔액 합 보존 여부, 음수 잔액 계좌 수 (정합성)

## 주의

- 측정 시 velocity FDS 룰 임계치만 올린다(같은 계좌 반복 송금이 보류되지 않도록). 룰 평가 비용은 그대로 포함된다.
- 기존 `docker-compose.yml` 스택과 포트가 겹치지 않는다(18081, 55432/55433, 59092, 51025, 8474).
- 노트북 1대에서 k6·백엔드·인프라를 함께 돌린 수치라 절대값보다 **같은 조건의 전/후 비율**로 읽는다.
