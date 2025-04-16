# 1. 빌드 단계
FROM openjdk:17-jdk-slim AS build
WORKDIR /app

# gradle wrapper 관련 파일 복사 (gradle-wrapper.jar 포함!)
COPY gradlew .
COPY gradlew.bat .
COPY gradle ./gradle

# 프로젝트 소스 복사
COPY build.gradle .
COPY settings.gradle .
COPY src ./src

# 실행 권한 부여 및 gradle 빌드
RUN chmod +x gradlew
RUN ./gradlew clean build -x test --no-daemon

# 2. 실행 단계
FROM openjdk:17-jdk-slim
WORKDIR /app

# 빌드된 jar 복사
COPY --from=build /app/build/libs/*.jar ./app.jar

# JAR 확인
RUN ls -al /app

# 앱 실행
ENTRYPOINT ["java", "-jar", "app.jar"]