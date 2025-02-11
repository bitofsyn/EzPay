##FROM ubuntu:latest
#FROM openjdk:17-jdk-slim
#LABEL authors="family"
#WORKDIR /app
#COPY build/libs/EzPay-0.0.1-SNAPSHOT.jar app.jar
#ENTRYPOINT ["java", "-jar", "app.jar"]
# 1. Base image 설정
FROM openjdk:17-jdk-slim as build

# 2. 작업 디렉토리 설정
WORKDIR /app

# 3. 프로젝트 파일 복사
COPY . /app

# 4. Gradle 빌드 실행
RUN ./gradlew clean build -x test

# 5. 최종 실행 JAR 파일 복사
FROM openjdk:17-jdk-slim
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar

# 6. Spring Boot 실행
ENTRYPOINT ["java", "-jar", "app.jar"]
