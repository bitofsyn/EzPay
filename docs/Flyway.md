# Flyway 데이터베이스 마이그레이션

## 도입 목적

기존에는 Hibernate의 `ddl-auto: update`가 실행 시점에 운영 데이터베이스 스키마를 변경했습니다. 이 방식은 변경 순서와 적용 이력을 명확하게 추적하기 어렵기 때문에 Flyway로 스키마 버전을 관리합니다.

Flyway 도입 이후 Hibernate는 엔티티와 데이터베이스 구조가 일치하는지만 검증합니다.

```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: validate
```

## 파일 위치와 이름

마이그레이션 파일은 다음 경로에 저장합니다.

```text
backend/src/main/resources/db/migration/
```

파일 이름은 `V버전__설명.sql` 형식을 사용합니다.

```text
V1__initial_schema.sql
V2__add_transaction_index.sql
V3__add_notification_status.sql
```

이미 적용된 파일은 수정하지 않습니다. 변경이 필요하면 반드시 다음 버전 파일을 추가합니다. Flyway는 적용된 파일의 체크섬을 저장하므로 기존 파일을 수정하면 애플리케이션 시작 시 검증 오류가 발생합니다.

## 기존 운영 데이터베이스 처리

Render의 기존 PostgreSQL에는 이미 Hibernate가 생성한 테이블이 있습니다. `baseline-on-migrate: true`와 `baseline-version: 1` 설정으로 기존 스키마를 버전 1 기준점으로 등록합니다.

- 기존 데이터베이스: 현재 스키마를 버전 1로 기록하고 `V1`을 다시 실행하지 않습니다.
- 비어 있는 데이터베이스: `V1__initial_schema.sql`을 실행해 전체 초기 스키마를 생성합니다.
- 이후 데이터베이스: `V2`부터 순서대로 변경 사항을 적용합니다.

이 과정은 기존 테이블이나 데이터를 삭제하지 않습니다. 최초 배포 후 `flyway_schema_history` 테이블이 생성되었는지 확인해야 합니다.

## 새 마이그레이션 작성 절차

1. 엔티티 변경에 필요한 SQL을 새 버전 파일로 작성합니다.
2. 로컬 또는 테스트 데이터베이스에서 마이그레이션을 실행합니다.
3. `./gradlew test`로 엔티티와 스키마 검증 및 회귀 테스트를 수행합니다.
4. 변경 내용을 배포한 뒤 애플리케이션 시작 로그에서 Flyway 적용 버전을 확인합니다.

예를 들어 컬럼을 추가할 때는 다음과 같이 작성합니다.

```sql
-- V2__add_transaction_reference.sql
ALTER TABLE transactions
    ADD COLUMN external_reference VARCHAR(100);

CREATE UNIQUE INDEX uk_transactions_external_reference
    ON transactions (external_reference);
```

## 실패 시 확인 사항

- `Validate failed`: 이미 적용된 마이그레이션 파일이 수정되었는지 확인합니다.
- 엔티티 검증 실패: 마이그레이션 SQL과 엔티티의 컬럼명, 타입, null 허용 여부를 비교합니다.
- 버전 충돌: 동일한 버전 번호를 가진 파일이 둘 이상인지 확인합니다.
- 운영 적용 실패: 실패한 SQL과 데이터 상태를 먼저 확인하고, 임의로 `flyway_schema_history`를 수정하지 않습니다.

운영 데이터베이스를 변경하기 전에는 백업 또는 복구 지점을 준비하고, 삭제·타입 변경처럼 되돌리기 어려운 작업은 데이터 이전 단계를 나누어 적용합니다.
