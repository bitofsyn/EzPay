FROM eclipse-temurin:17-jdk-jammy AS build
WORKDIR /app

RUN echo "rootProject.name = 'backend'" > settings.gradle

COPY backend/gradlew .
COPY backend/gradlew.bat .
COPY backend/gradle ./gradle
COPY backend/build.gradle .
COPY backend/src ./src

RUN chmod +x gradlew
RUN ./gradlew clean build -x test --no-daemon

FROM eclipse-temurin:17-jdk-jammy
WORKDIR /app

COPY --from=build /app/build/libs/*.jar ./app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
