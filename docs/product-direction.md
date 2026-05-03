# EzPay Product Direction

## Product Statement

EzPay는 한국 금융 거래 데이터를 연결하고, 소비 패턴을 자동으로 분석해 행동 가능한 인사이트를 제공하는 개인 금융 분석 서비스다.

## Why This Direction

- 임시 계좌 기반 송금 데모는 포트폴리오 차별점이 약하다.
- 한국 오픈뱅킹 연동 구조는 사용자 동의, 토큰 관리, 거래 동기화, 정규화, 분석 파이프라인을 함께 보여줄 수 있다.
- 소비 분석과 인사이트 자동화는 현재 AI/자동화 흐름과 자연스럽게 연결된다.

## What We Want to Show

- 한국 금융 API 연동 역량
- 거래 sync 및 webhook/배치 처리 구조
- 금융 데이터 정규화와 분석 파이프라인 설계
- 설명 가능한 인사이트 생성

## Core Experience

1. Connect account with Korean open banking
2. Sync transactions
3. Normalize data
4. Categorize and analyze
5. Generate insights
6. Explain insights in natural language

## Scope Decisions

### Keep
- Authentication
- Account connection flow
- Transaction history
- Spending statistics
- Category classification
- Insight generation
- AI explanation

### Deprioritize
- Manual transfer flow
- Transfer limits
- Recipient-driven UX
- Large admin surface
- Generic finance chatbot

## Integration Strategy

### Phase 1
- Build a bank connector abstraction
- Implement a KFTC/Open Banking inquiry connector skeleton
- Use local sample data or sandbox adapters for sync pipeline verification

### Phase 2
- Add real KFTC/Open Banking inquiry integration
- Keep provider-specific auth and sync logic isolated

## Success Criteria

- A user can complete a Korean open banking style connection flow and sync real or sample transaction data.
- The system stores normalized transactions and updates incrementally.
- The dashboard explains spending changes with clear evidence.
- The AI layer explains insights instead of answering broad finance questions.
