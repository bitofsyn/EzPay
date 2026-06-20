# EzPay - 간편 송금 서비스

![Java](https://img.shields.io/badge/Java-17-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4.2-green)
![React](https://img.shields.io/badge/React-19-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-RDS-336791)
![AWS](https://img.shields.io/badge/AWS-CloudFront%20%7C%20S3-orange)

---

## 🌐 라이브 서비스

| 환경 | URL | 상태 |
|------|-----|------|
| **프론트엔드** | `<CloudFront URL>` | ✅ 배포 완료 |
| **백엔드 API** | `<Render/Railway Backend URL>` | ✅ 배포 완료 |
| **헬스 체크** | `<Backend URL>/health` | ✅ `{"status":"ok"}` |

---

## 📋 프로젝트 구조

```
EzPay/
├── backend/                    # Spring Boot API
│   ├── build.gradle           # Gradle 설정 (Java 17)
│   ├── src/main/resources/
│   │   └── application.yml    # 환경변수 기반 설정
│   └── src/main/java/
│       └── com.example.ezpay/
├── frontend/                   # React + Vite
│   ├── vite.config.ts
│   ├── .env                   # API URL 설정
│   ├── src/
│   └── dist/                  # S3에 배포되는 파일
└── README.md
```

---

## 🚀 빠른 시작

### 백엔드 (Render에 배포됨)

#### 로컬 개발

**1. 환경변수 설정** (`backend/.env`)
```env
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/ezpay
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=your-password
SPRING_KAFKA_BOOTSTRAP_SERVERS=localhost:9092
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

**2. 빌드 및 실행**
```bash
cd backend
./gradlew bootRun
```

백엔드는 `http://localhost:8081`에서 시작됩니다.

---

### 프론트엔드 (CloudFront + S3에 배포됨)

#### 로컬 개발

**1. 의존성 설치**
```bash
cd frontend
npm install
```

**2. 개발 서버 실행**
```bash
npm run dev
```

프론트엔드는 `http://localhost:5173`에서 시작됩니다.

**3. 프로덕션 빌드**
```bash
npm run build
```

`frontend/dist/` 폴더가 생성됩니다.

---

## 🌍 배포 가이드

### 1. 백엔드 배포 (Render)

#### 환경변수 설정 (Render Dashboard)

```env
# 필수
DATABASE_URL=jdbc:postgresql://<RDS-ENDPOINT>:5432/ezpay?sslmode=require
DB_USERNAME=postgres
DB_PASSWORD=<YOUR_RDS_PASSWORD>
SPRING_PROFILES_ACTIVE=prod
PORT=8080

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://<YOUR_CLOUDFRONT_DOMAIN>

# Email
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# API Security
EZPAY_INTERNAL_API_SECRET_KEY=<RANDOM_SECRET_KEY>

# Monitoring (선택사항)
SENTRY_DSN=<YOUR_SENTRY_DSN>
```

#### 배포 명령

```bash
# Render 대시보드에서 "Manual Deploy" 클릭
# 또는 GitHub 푸시 시 자동 배포 (GitHub 연결 필요)
```

#### 빌드 및 시작 설정

- **Root directory**: `backend/`
- **Build command**: `./gradlew clean bootJar -x test`
- **Start command**: `java -jar build/libs/app.jar`

#### 배포 확인

```bash
# 헬스 체크
curl https://<YOUR_BACKEND_DOMAIN>/health
# 응답: {"status":"ok"}
```

---

### 2. 프론트엔드 배포 (S3 + CloudFront)

#### 단계 1: 빌드

```bash
cd frontend
npm run build
```

#### 단계 2: API URL 설정

`frontend/.env` 수정:
```env
VITE_API_BASE_URL=https://<YOUR_BACKEND_DOMAIN>
```

#### 단계 3: S3에 업로드

```bash
aws s3 sync frontend/dist/ s3://<YOUR_BUCKET_NAME>/ --delete
```

#### 단계 4: CloudFront 캐시 무효화

```bash
aws cloudfront create-invalidation \
  --distribution-id <YOUR_DISTRIBUTION_ID> \
  --paths "/*"
```

#### 단계 5: CloudFront 설정

**AWS CloudFront Console**:
1. Distribution ID: `<YOUR_DISTRIBUTION_ID>`
2. Settings → Default Root Object: `index.html`
3. Save

---

## 📊 기술 스택

### 백엔드

| 기술 | 버전 | 용도 |
|------|------|------|
| Java | 17 | 언어 |
| Spring Boot | 3.4.2 | 프레임워크 |
| Spring Security | 6.4.5 | 인증/인가 |
| JPA/Hibernate | - | ORM |
| PostgreSQL | - | 데이터베이스 |
| JWT | 0.12.6 | 토큰 인증 |

### 프론트엔드

| 기술 | 버전 | 용도 |
|------|------|------|
| React | 19 | UI 라이브러리 |
| Vite | - | 빌드 도구 |
| TypeScript | - | 타입 안전성 |
| Axios | - | HTTP 클라이언트 |

### 배포/인프라

| 서비스 | 용도 |
|--------|------|
| AWS RDS (PostgreSQL) | 데이터베이스 |
| AWS S3 | 프론트엔드 호스팅 |
| AWS CloudFront | CDN |
| Render | 백엔드 호스팅 |

---

## 🔐 보안

### 환경변수 관리

민감 정보는 환경변수로만 관리됩니다:
- ✅ 백엔드: Render Environment Variables
- ✅ 프론트엔드: 빌드 타임 환경변수 (`.env`)
- ❌ 코드에 하드코딩 금지

### CORS 정책

백엔드는 다음 도메인만 허용:
```
http://localhost:3000 (로컬 개발)
https://<YOUR_CLOUDFRONT_DOMAIN> (프로덕션)
```

### HTTPS 적용

- ✅ CloudFront: HTTPS 자동 제공
- ✅ Render: 자동 SSL/TLS
- ✅ RDS: SSL 암호화 연결

---

## 📝 API 문서

### 헬스 체크

```http
GET /health
```

**응답:**
```json
{"status":"ok"}
```

---

## 🛠️ 로컬 개발 환경 설정

### 필수 설치

- Java 17
- Node.js 18+
- PostgreSQL 14+
- Git

### 데이터베이스 설정

```bash
# PostgreSQL 로컬 실행
createdb ezpay

# 또는 Docker 사용
docker run -d \
  -e POSTGRES_DB=ezpay \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:14
```

### 환경변수 설정

**backend/.env**:
```env
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/ezpay
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=password
SPRING_PROFILES_ACTIVE=local
```

**frontend/.env**:
```env
VITE_API_BASE_URL=http://localhost:8081
```

### 동시 실행

**터미널 1 (백엔드)**:
```bash
cd backend
./gradlew bootRun
```

**터미널 2 (프론트엔드)**:
```bash
cd frontend
npm run dev
```

---

## ✨ 주요 기능

- ✅ 회원가입/로그인 (JWT 토큰)
- ✅ 계좌 생성 및 관리
- ✅ 계좌 송금
- ✅ 거래 내역 조회
- ✅ 계좌 통계
- ✅ 관리자 대시보드
- ✅ 비밀번호 재설정

---

## 📞 문제 해결

### 프론트엔드가 백엔드를 찾을 수 없음

**확인 사항:**
1. 백엔드가 실행 중인지 확인: `https://<YOUR_BACKEND_DOMAIN>/health`
2. `frontend/.env`의 `VITE_API_BASE_URL`이 올바른지 확인
3. CORS 설정 확인: `CORS_ALLOWED_ORIGINS`에 프론트엔드 URL 포함

### 데이터베이스 연결 실패

**확인 사항:**
1. RDS 엔드포인트 확인
2. 보안 그룹에서 5432 포트 열려있는지 확인
3. 자격증명 (사용자명/비밀번호) 확인

### CloudFront에서 404 에러

**확인 사항:**
1. S3 버킷에 파일이 업로드되었는지 확인
2. CloudFront의 Default Root Object가 `index.html`로 설정되었는지 확인
3. 캐시 무효화 확인

---

## 🔄 향후 개선

- [ ] 커스텀 도메인 (`ezpay.com`) 연결
- [ ] 모바일 앱 개발
- [ ] 2FA 추가
- [ ] 암호화폐 연동
- [ ] AI 기반 사기 탐지

---

**마지막 업데이트**: 2026-06-21
