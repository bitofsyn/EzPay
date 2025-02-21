# 1. 빌드 스테이지 (Gradle 빌드 전용)
FROM openjdk:17-jdk-slim AS build

# 2. 작업 디렉토리 설정
WORKDIR /app

# 3. Gradle Wrapper 복사
COPY gradlew ./
COPY gradle gradle/

# 4. 실행 권한 부여 + CRLF 변환
RUN apt-get update && apt-get install -y dos2unix && \
    dos2unix gradlew && chmod +x gradlew

# 5. Gradle 버전 확인 (디버깅용)
RUN ./gradlew --version

# 6. 의존성 다운로드 (캐싱 최적화)
COPY build.gradle settings.gradle ./
RUN ./gradlew dependencies --no-daemon

# 7. 전체 프로젝트 복사 및 빌드 실행
COPY . .
RUN ./gradlew clean build -x test --no-daemon

# 8. 실행 스테이지 (최종 JAR 실행)
FROM openjdk:17-jdk-slim
WORKDIR /app

# 9. 빌드된 JAR 파일만 복사
COPY --from=build /app/build/libs/*.jar app.jar

# 10. Spring Boot 실행
ENTRYPOINT ["java", "-jar", "app.jar"]
