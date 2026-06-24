# ─────────────────────────────────────────────
# Stage 1: Build
# ─────────────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# Copy Maven wrapper and pom first for layer caching
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Download dependencies (cached unless pom.xml changes)
RUN ./mvnw dependency:go-offline -q

# Copy source and build the fat JAR, skipping tests
COPY src src
RUN ./mvnw package -DskipTests -q

# ─────────────────────────────────────────────
# Stage 2: Runtime
# ─────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Create a non-root user for security
RUN addgroup -S trustra && adduser -S trustra -G trustra

# Copy the built JAR from the builder stage
COPY --from=builder /app/target/Trustra-*.jar app.jar

# Switch to non-root user
USER trustra

# Expose the default Spring Boot port
EXPOSE 8080

# Environment variable defaults (override at runtime)
ENV SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/postgres \
    SPRING_DATASOURCE_USERNAME=trustra \
    SPRING_DATASOURCE_PASSWORD= \
    TRUSTRA_FRONTEND_ORIGIN=http://localhost:3000

ENTRYPOINT ["java", "-jar", "app.jar"]
