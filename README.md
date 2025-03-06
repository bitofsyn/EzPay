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
- ✅ 사용자 알림 시스템 (notifications API 개발 완료)
- ✅ 장애 로그 관리 (error_logs API 개발 완료)

---

## 🚀 진행 상황

1. ✅ 현재까지 구현된 기능
   - users, accounts, transactions, transfer_limits 테이블 CRUD 기능 구현 완료
   - 사용자 인증 및 계좌 생성 API 개발 완료
   - 송금 요청 API 및 Kafka 연동 개발 완료
   - 거래 내역 조회 API 구현
   - 알림 시스템 (notifications) API 개발 완료
   - 장애 로그 (error_logs) API 개발 완료
   - Docker 기반의 컨테이너화 및 MSA 구조 적용

2. 🔜 앞으로 추가할 기능

- 관리자 API 개발
    - admin_users, admin_accounts, admin_transactions 등 관리자용 테이블 CRUD 기능 구현
- 관리자 대시보드 API 개발
- 예외처리 및 보안 강화
- JWT 및 인증 처리
- 데이터 유효성 검사 및 예외 처리 추가
- CI/CD 적용
- Jenkins를 활용한 자동 배포 환경 구축
- MSA 및 Kubernetes 적용
- MSA 구조 최적화 및 Kubernetes 클러스터 적용
- 프론트엔드 개발 (React)
    - 송금 UI/UX 디자인 및 API 연동
- 비트코인 및 블록체인 기능 추가 (추후 확장 계획)
- 비트코인 지갑 연동 및 송금 기능 추가
- 블록체인 기반 거래 내역 기록 및 검증

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
git clone https://github.com/soyoonjeong2328/EzPay.git
cd simple-remittance-system/backend

# 환경 설정 (Kafka 및 DB 실행)
docker-compose up -d

# Spring Boot 실행
./gradlew bootRun