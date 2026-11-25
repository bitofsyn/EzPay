# 실행·배포·테스트

## 로컬 실행

### 사전 준비

- Docker Desktop 및 Docker Compose
- PostgreSQL 데이터베이스
- 컨테이너를 사용하지 않는 경우 Java 17, Node.js 18 이상과 Python 3

### 환경 파일 준비

비밀값을 포함하는 환경 파일은 저장소에서 제외됩니다. 실행 전에 다음 파일을 직접 생성합니다.

`backend/.env`

```env
SPRING_DATASOURCE_URL=jdbc:postgresql://host.docker.internal:5432/ezpay
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=your-password
SPRING_PROFILES_ACTIVE=local
SPRING_KAFKA_BOOTSTRAP_SERVERS=kafka:9092
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FRONTEND_BASE_URL=http://localhost:3000
```

`frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:8081
```

`ai-category-server/config/.env`

```env
KAFKA_ENABLED=true
KAFKA_BOOTSTRAP_SERVERS=kafka:9092
AI_PRIMARY_PROVIDER=local
AI_FALLBACK_ENABLED=false
LM_STUDIO_BASE_URL=http://host.docker.internal:1234/v1
LM_STUDIO_MODEL=local-model
```

### 실행과 종료

```bash
./start.sh
```

| 서비스 | 로컬 주소 |
|---|---|
| Web UI | http://localhost:3000 |
| Backend API | http://localhost:8081 |
| AI Category API | http://localhost:8000 |
| MLflow | http://localhost:5001 |
| Prometheus | http://localhost:9090 |
| Alertmanager | http://localhost:9093 |
| Grafana | http://localhost:3001 |

```bash
./stop.sh
```

데이터 볼륨까지 함께 삭제하려면 `./stop.sh -v`를 사용합니다. 이 명령은 Kafka, MLflow와 모니터링 데이터를 복구할 수 없게 삭제하므로 주의해야 합니다.

## 환경 설정

주요 설정은 코드에 저장하지 않고 환경변수로 주입합니다.

| 변수 | 설명 | 기본값 |
|---|---|---|
| `SPRING_DATASOURCE_URL` | PostgreSQL 연결 주소 | 로컬 PostgreSQL |
| `SPRING_DATASOURCE_USERNAME` | 데이터베이스 사용자 | `postgres` |
| `SPRING_DATASOURCE_PASSWORD` | 데이터베이스 비밀번호 | 로컬 개발값 |
| `EZPAY_KAFKA_ENABLED` | Kafka 사용 여부. `true`면 송금을 Kafka로 비동기 처리하고, `false`면 요청 안에서 바로 처리합니다(공개 배포) | `false` |
| `SPRING_KAFKA_BOOTSTRAP_SERVERS` | Kafka 연결 주소 | `localhost:9092` |
| `SMTP_USERNAME` | 비밀번호 재설정 메일 발신 계정 | 필수 |
| `SMTP_PASSWORD` | 메일 계정 비밀번호 | 필수 |
| `ADMIN_ALERT_EMAIL` | 위험 거래 알림을 받을 관리자 이메일. 시스템 경보(Alertmanager)의 수신 주소 기본값으로도 쓰입니다 | `SMTP_USERNAME` |
| `ALERT_EMAIL_TO` | 시스템 경보 메일 수신 주소(선택). 지정하면 `ADMIN_ALERT_EMAIL`보다 우선합니다 | `ADMIN_ALERT_EMAIL` |
| `GRAFANA_ADMIN_PASSWORD` | Grafana 관리자 비밀번호. 최초 생성 시에만 적용됩니다 | `admin` |
| `MANAGEMENT_ENDPOINTS_INCLUDE` | 노출할 Actuator 엔드포인트. 공개 배포에서는 설정하지 않습니다 | `health,info` |
| `MANAGEMENT_HEALTH_MAIL_ENABLED` | 헬스 체크에 SMTP 연결 확인 포함 여부. SMTP가 막힌 환경에서는 켜지 않습니다 | `false` |
| `EMAIL_MAX_ATTEMPTS` | 이메일 최대 발송 시도 횟수 | `3` |
| `EMAIL_RETRY_DELAY_SECONDS` | 실패 후 재시도 대기 시간(초) | `60` |
| `KAKAO_CLIENT_ID` | 카카오 로그인 클라이언트 ID | 미설정 |
| `NAVER_CLIENT_ID` | 네이버 로그인 클라이언트 ID | 미설정 |
| `EZPAY_FDS_BLOCK_SCORE` | 위험 거래 차단 점수 | `80` |
| `EZPAY_FDS_REVIEW_SCORE` | 관리자 검토 점수 | `40` |
| `NVIDIA_API_KEY` | NVIDIA NIM 인증 키 | 미설정 |
| `SENTRY_DSN` | 오류 수집 서비스 연결 주소 | 미설정 |

## CI/CD

Pull Request와 `main` 브랜치 Push 시 GitHub Actions가 프론트엔드 코드 검사·빌드와 백엔드 테스트를 수행합니다. `main` 브랜치의 CI가 성공한 경우에만 운영 환경 배포가 자동으로 시작됩니다.

```text
main Push → CI 성공 ┬→ Cloudflare Workers 프론트엔드 배포
                    └→ Render Deploy Hook을 통한 백엔드 배포
```

| 영역 | 배포 환경 | 배포 방식 |
|---|---|---|
| Frontend | Cloudflare Workers | GitHub Actions에서 빌드 후 Wrangler로 배포 |
| Backend | Render Web Service | GitHub Actions에서 Deploy Hook 호출 |
| Database | AWS RDS PostgreSQL | Render 환경변수로 연결 정보 주입 |
| CI/CD | GitHub Actions | CI 성공 후 CD 실행 |

프론트엔드 빌드에는 배포된 백엔드 주소를 사용하고, 백엔드의 `CORS_ALLOWED_ORIGINS`에는 Cloudflare Workers 주소를 등록합니다. CD는 GitHub `production` 환경의 다음 설정을 사용합니다.

| 구분 | 이름 | 용도 |
|---|---|---|
| Secret | `CLOUDFLARE_API_TOKEN` | Cloudflare Workers 배포 권한 |
| Secret | `RENDER_DEPLOY_HOOK_URL` | Render 백엔드 배포 요청 |
| Variable | `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 계정 식별자 |
| Variable | `VITE_API_BASE_URL` | 배포 백엔드 주소 |
| Variable | `VITE_KAKAO_CLIENT_ID` | 카카오 로그인 클라이언트 ID |
| Variable | `VITE_NAVER_CLIENT_ID` | 네이버 로그인 클라이언트 ID |

### 로컬 Jenkins 파이프라인

Jenkins는 공개 운영 배포와 분리된 로컬 CI/CD 환경으로 사용합니다. 프런트엔드 검사·빌드와 백엔드 테스트가 모두 성공하면 이 Mac에서 Docker Compose 스택을 다시 빌드하고 기동한 뒤 헬스 체크를 수행합니다.

```text
Checkout → Frontend CI → Backend CI → Docker Compose 배포 → Health Check
```

비밀 환경변수는 Git에 커밋하지 않습니다. Jenkins를 실행하는 사용자 계정에 다음 파일을 준비합니다.

```text
~/.jenkins/ezpay-env/backend.env
~/.jenkins/ezpay-env/frontend.env
~/.jenkins/ezpay-env/ai-category.env
```

Jenkins에서 Pipeline 작업을 만들고 **Pipeline script from SCM**을 선택한 뒤 저장소 URL과 `Jenkinsfile`을 지정합니다. `DEPLOY_LOCAL`을 끄면 테스트와 빌드만 수행합니다. 로컬 배포에는 실행 중인 Docker Desktop이 필요합니다.

## 개별 실행 및 테스트

### Backend

```bash
cd backend
./gradlew bootRun
./gradlew test
```

백엔드 테스트에는 송금 동시성, 계좌 잠금, 사용자 권한, 비밀번호 재설정, 위험 거래와 Kafka 실패 이벤트 처리가 포함됩니다. PostgreSQL 기반 테스트에는 Docker가 필요합니다.

### Frontend

```bash
cd frontend
npm ci
npm run start
npm run lint
npm run build
npm run test:e2e
```

### AI Category Server

```bash
cd ai-category-server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
