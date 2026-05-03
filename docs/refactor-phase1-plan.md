# EzPay Refactor Phase 1 Plan

## Goal

Phase 1의 목표는 EzPay를 송금 데모에서 거래 연결 기반 개인 금융 분석 서비스로 전환하기 위한 최소 구조를 만드는 것이다.

## Product Scope

### Keep
- Authentication
- Existing dashboard shell
- Account list and account detail screens
- Transaction history and statistics screens
- Category classification server
- AI explanation server

### Deprioritize
- Transfer request flow
- Transfer limit settings
- Recipient-driven UX
- Transfer-specific admin features
- Generic finance chatbot positioning

## New Core Flow

1. User signs in
2. User connects a financial data provider
3. Backend exchanges provider auth artifacts for a durable connection
4. Backend syncs transactions incrementally
5. Transactions are normalized into an internal shape
6. Analysis jobs generate spending summaries and insight candidates
7. UI shows insights with supporting transactions

## Backend Workstream

### 1. Introduce provider abstraction
- Add `FinancialDataProvider`
- Add `BankConnector` interface
- Add provider registry / lookup layer
- Start with `PlaidSandboxConnector`

### 2. Separate sync model from transfer model
- Keep current `Transaction` entity intact temporarily
- Introduce a new normalized transaction model in the next phase
- Do not overload the current sender/receiver transfer schema for provider-synced data

### 3. Add connection-oriented API surface
- `POST /api/connections/link-token`
- `POST /api/connections/exchange`
- `POST /api/transactions/sync`
- `GET /api/insights`

### 4. Add sync metadata model
- provider
- connection status
- provider account id
- sync cursor
- last synced at

## Frontend Workstream

### 1. Navigation changes
- Keep current routes working
- Move `SendMoney` out of the main happy path
- Promote account connection and analysis entry points

### 2. Dashboard changes
- Replace transfer CTA with transaction analysis CTA
- Add insight summary cards
- Add sync status entry point

### 3. AI changes
- Reposition assistant as insight explainer
- Limit prompts to transaction and spending analysis

## Data Model Proposal

### Current limitation
Current `Transaction` is transfer-oriented:
- `senderAccount`
- `receiverAccount`
- `requestId`
- `status`

This shape is suitable for internal transfer processing but not for imported bank transactions.

### Proposed normalized transaction fields
- `transaction_id`
- `user_id`
- `connection_id`
- `provider`
- `provider_transaction_id`
- `provider_account_id`
- `posted_at`
- `authorized_at`
- `amount`
- `currency_code`
- `direction`
- `merchant_name`
- `description`
- `category_primary`
- `category_detailed`
- `is_pending`
- `raw_payload`

## Migration Strategy

### Phase 1
- Document product direction
- Add connector abstraction
- Keep transfer code working
- Start integrating provider sync path in parallel

### Phase 2
- Add normalized transaction entity and repositories
- Build Plaid Sandbox sync path end-to-end
- Feed dashboard and insights from normalized transactions

### Phase 3
- Remove transfer-first assumptions from statistics and UI
- Retire transfer-focused endpoints from primary experience

## Success Criteria

- Codebase has a clear connector abstraction
- Product scope is documented in repo
- Frontend positioning no longer depends on transfer messaging
- Phase 2 can begin without re-litigating architecture
