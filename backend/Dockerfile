# 1. 빌드 단계
FROM eclipse-temurin:17-jdk-jammy AS build
WORKDIR /app

COPY gradlew .
COPY gradlew.bat .
COPY gradle ./gradle
COPY build.gradle .
COPY settings.gradle .
COPY src ./src

RUN chmod +x gradlew
RUN ./gradlew clean build -x test --no-daemon

# 2. 실행 단계
FROM eclipse-temurin:17-jdk-jammy
WORKDIR /app

# 빌드된 jar 복사
COPY --from=build /app/build/libs/*.jar ./app.jar

# JAR 확인
RUN ls -al /app

ENTRYPOINT ["java", "-jar", "app.jar"]