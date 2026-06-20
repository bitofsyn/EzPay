# Backend Deployment

This backend is ready to deploy to Render or Railway with the service root set to `backend/`.
All configuration is centralized in `src/main/resources/application.yml`.

## Required Environment Variables

Minimum:

```env
PORT=8080
DB_HOST=<rds-endpoint>
DB_PORT=5432
DB_NAME=<db-name>
DB_USERNAME=<db-username>
DB_PASSWORD=<db-password>
JWT_SECRET=<your-jwt-secret-if-used-in-env>
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend-domain
SPRING_JPA_HIBERNATE_DDL_AUTO=validate
SPRING_JPA_SHOW_SQL=false
SPRING_JPA_FORMAT_SQL=false
SPRING_SQL_INIT_MODE=never
LOGGING_LEVEL_ORG_HIBERNATE_SQL=INFO
LOGGING_LEVEL_ORG_HIBERNATE_BINDER=INFO
LOGGING_LEVEL_ORG_SPRINGFRAMEWORK_SECURITY=INFO
```

Alternative datasource form:

```env
DATABASE_URL=jdbc:postgresql://<rds-endpoint>:5432/<db-name>
DB_USERNAME=<db-username>
DB_PASSWORD=<db-password>
```

## Render

- Root directory: `backend`
- Build command: `./gradlew clean bootJar -x test`
- Start command: `java -jar build/libs/app.jar`
- Health check path: `/health`
- Runtime: Java 17

## Railway

- Root directory: `backend`
- Build command: `./gradlew clean bootJar -x test`
- Start command: `java -jar build/libs/app.jar`
- Health check path: `/health`
- Runtime: Java 17

## Docker Deployment Option

The project already includes a Dockerfile. If the platform uses Docker:

- Docker build context: `backend`
- Exposed port: application reads `PORT` automatically

## Local Defaults

If the variables above are omitted, local-friendly defaults are used:

- `ddl-auto=update`
- `show-sql=true`
- `sql.init.mode=always`
- `localhost:5432/ezpay`

## Post-Deploy Checks

- Health check: `GET /health`
- Startup log: confirm `Tomcat started on port`
- Startup log: confirm `Started EzPayApplication`
- RDS connection: confirm no `HikariPool` connection failure
- Hibernate validation: confirm no schema validation error under `prod`
