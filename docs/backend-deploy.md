# Backend Deployment

This backend is ready to deploy to Render or Railway with the service root set to `backend/`.
All configuration is centralized in `src/main/resources/application.yml`.

## Required Environment Variables

Minimum:

```env
SPRING_PROFILES_ACTIVE=prod
PORT=8080
DB_HOST=<rds-endpoint>
DB_PORT=5432
DB_NAME=<db-name>
DB_USERNAME=<db-username>
DB_PASSWORD=<db-password>
JWT_SECRET=<your-jwt-secret-if-used-in-env>
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://xxxxx.cloudfront.net
EZPAY_INTERNAL_API_SECRET_KEY=<random-secret>
SENTRY_DSN=
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

If `SPRING_PROFILES_ACTIVE` is omitted, `prod` is used.

Local profile:

- `ddl-auto=update`
- `show-sql=true`
- `sql.init.mode=always`
- `localhost:5432/ezpay`

Production profile:

- `ddl-auto=validate`
- `show-sql=false`
- `sql.init.mode=never`

## Post-Deploy Checks

- Health check: `GET /health`
- Startup log: confirm `Tomcat started on port`
- Startup log: confirm `Started EzPayApplication`
- RDS connection: confirm no `HikariPool` connection failure
- Hibernate validation: confirm no schema validation error under `prod`

## End-to-End Order

1. Deploy Spring Boot from `backend/` to Render or Railway.
2. Set backend environment variables and confirm `GET /health` returns `200`.
3. Copy the deployed backend URL.
4. Update `frontend/.env` with `VITE_API_BASE_URL=<deployed-backend-url>`.
5. Run `npm run build` in `frontend/`.
6. Upload the files inside `frontend/dist/` to S3.
7. Run CloudFront invalidation with `/*`.
8. Open the CloudFront URL and test signup, login, and authenticated API calls.
