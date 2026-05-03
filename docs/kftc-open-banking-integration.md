# KFTC Open Banking Integration

## 목표

EzPay는 한국 금융 데이터 기준의 개인 금융 분석 앱으로 전환했기 때문에, 실제 거래 연동의 메인 경로는 금융결제원 오픈뱅킹 조회형 API다.

## 범위

- 잔액조회보다 `거래내역조회`를 우선한다.
- 송금/이체는 우선순위에서 제외한다.
- 핵심은 `사용자 동의 -> Access Token 확보 -> 핀테크이용번호 기반 거래 조회 -> 정규화 저장`이다.

## 연동 흐름

1. 사용자가 오픈뱅킹 인증 화면으로 이동한다.
2. 인가 코드 `authorization_code`를 수신한다.
3. 토큰 교환으로 `access_token`, `refresh_token`, `user_seq_no`를 저장한다.
4. 계좌등록/계좌등록확인 콜백에서 `fintech_use_num`과 선택 계좌 메타데이터를 저장한다.
5. 계좌통합조회 API로 사용자의 연결 계좌 목록을 확인한다.
6. 사용자가 동기화할 계좌를 선택해 저장한다.
7. 거래내역조회 API를 페이지 단위로 호출한다.
8. 응답을 `NormalizedTransaction`으로 매핑한다.
9. 대시보드와 인사이트 계산을 갱신한다.

## 필요한 설정값

- `EZPAY_KFTC_ENABLED`
- `KFTC_CLIENT_ID`
- `KFTC_CLIENT_SECRET`
- `KFTC_BASE_URL`
- `KFTC_AUTHORIZE_URL`
- `KFTC_TOKEN_URL`
- `KFTC_REDIRECT_URI`
- `KFTC_CLIENT_USE_CODE`
- `KFTC_SCOPE`
- `KFTC_FINTECH_USE_NUM`
- `KFTC_INQUIRY_START_DATE`
- `KFTC_INQUIRY_END_DATE`

## 백엔드 스켈레톤 반영 위치

- properties: `KftcOpenBankingProperties`
- connector: `KftcOpenBankingConnector`
- DTO:
  - `KftcAuthorizationRequest`
  - `KftcTokenExchangeRequest`
  - `KftcTokenExchangeResult`
  - `KftcTransactionInquiryRequest`
  - `KftcAuthorizationCallbackResult`
- `KftcTokenExchangeCallbackRequest`
- `KftcTokenExchangeCallbackResult`
  - `KftcAccountInfoRequest`
  - `KftcAccountInfoItem`
  - `KftcAccountInfoResponse`
  - `KftcSelectedAccountRequest`
  - `KftcSelectedAccountResult`

## 실제 구현 시 해야 할 일

1. 사용자 동의 URL 생성 로직 구현
2. redirect callback 엔드포인트 추가
3. 토큰 교환 응답 저장
4. `fintech_use_num` 계좌별 저장 구조 추가
5. 거래내역조회 응답 DTO 추가
6. 페이지네이션 및 증분 동기화 처리
7. 오류 코드와 만료 토큰 재발급 처리

## 현재 구현 상태

- `GET /api/connections/kftc/callback`에서 인가 코드를 저장한다.
- `GET /api/connections/kftc/account-registration/callback`에서 계좌등록 결과와 `fintech_use_num`을 저장한다.
- `POST /api/connections/kftc/account-info`로 계좌통합조회 결과를 가져온다.
- `POST /api/connections/kftc/selected-account`로 동기화 계좌를 저장한다.
- `POST /api/transactions/sync`로 거래내역조회 결과를 정규화 저장한다.

## 현재 상태

- EzPay는 KFTC Open Banking을 메인 provider로 간주한다.
- 아직 실제 호출은 구현하지 않았다.
- 대신 설정값, 요청 DTO, connector 책임 경계를 먼저 고정했다.
