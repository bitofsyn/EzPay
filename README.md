# 🏦 Simple Remittance System (간단한 송금 시스템)

본 프로젝트는 **간단한 송금 시스템**을 구현하는 것으로, 사용자가 손쉽게 송금을 진행할 수 있도록 설계되었습니다.  
**Spring Boot 기반의 MSA 구조**와 **Kafka를 활용한 비동기 메시징**을 도입하여 안정적인 송금 서비스 운영을 목표로 합니다.  
프론트엔드는 **React**를 사용하여 직관적인 UI/UX를 제공합니다.

## 📌 주요 기능
- ✅ 사용자 인증 및 계좌 관리
- ✅ 실시간 송금 요청 및 처리
- ✅ Kafka를 활용한 비동기 송금 프로세스
- ✅ Docker 기반의 MSA 환경 구축
- ✅ 거래 내역 조회 및 송금 상태 확인

---

## 🛠 기술 스택

### 🔹 Backend
- **Spring Boot** - 백엔드 API 개발
- **Kafka** - 비동기 메시지 큐
- **Docker** - 컨테이너화 및 배포
- **MSA (Microservices Architecture)** - 독립적인 서비스 구조

### 🔹 Frontend
- **React** - UI 개발
- **Axios** - API 통신
- **Styled-components** - 스타일링

---

## 🚀 프로젝트 실행 방법

### 1️⃣ Backend 실행
```bash
# 프로젝트 클론
git clone https://github.com/your-repository/simple-remittance-system.git
cd simple-remittance-system/backend

# 환경 설정 (Kafka 및 DB 실행)
docker-compose up -d

# Spring Boot 실행
./gradlew bootRun


