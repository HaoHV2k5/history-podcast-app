# ==============================================================================
# Multi-stage Dockerfile for Spring Boot Backend (Java 21)
# ==============================================================================

# Stage 1: Build JAR package
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder
WORKDIR /build

# Cache maven dependencies layer
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build production jar
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Minimal JRE 21 Runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Run as non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /build/target/*.jar app.jar
RUN chown -R appuser:appgroup /app

USER appuser
EXPOSE 8080

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
