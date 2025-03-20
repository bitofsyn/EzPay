# 1. 빌드 단계
FROM openjdk:17-jdk-slim AS build
WORKDIR /app
COPY ./backend /app
RUN ./gradlew clean build -x test --no-daemon

# 2. 실행 단계
FROM openjdk:17-jdk-slim
WORKDIR /app
COPY --from=build /app/build/libs/*.jar /app/app.jar
RUN ls -l /app  # JAR 파일 존재 여부 확인
ENTRYPOINT ["java", "-jar", "app.jar"]