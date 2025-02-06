#FROM ubuntu:latest
FROM openjdk:17-jdk-slim
LABEL authors="family"
WORKDIR /app
COPY build/libs/EzPay-0.0.1-SNAPSHOT.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]