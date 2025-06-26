# Build stage
FROM maven:3.8.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copy pom.xml and download dependencies
COPY payment-service/pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build
COPY payment-service/src ./src
COPY proto ./proto
RUN mvn clean package -DskipTests

# Runtime stage
FROM openjdk:17-jdk-slim
WORKDIR /app

# Create a non-root user
RUN addgroup --system spring && adduser --system --group spring
USER spring

# Copy the JAR file from build stage
COPY --from=build /app/target/*.jar app.jar

# Expose ports
EXPOSE 8083 9093

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8083/api/payments/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"] 