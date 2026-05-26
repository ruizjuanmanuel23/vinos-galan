# Multi-stage build optimizado para Railway
# El contexto del build es la raíz del repo (definido en railway.json)

# Stage 1: compilar con Maven + JDK 21
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Copia primero el pom.xml para aprovechar la cache de capas
COPY backend/pom.xml .
RUN mvn dependency:go-offline -B

# Copia el código y compila
COPY backend/src ./src
RUN mvn clean package -DskipTests -q

# Stage 2: runtime liviano
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Railway inyecta el PORT automáticamente
ENV SPRING_PROFILES_ACTIVE=prod
EXPOSE 8083

# Usamos sh -c para que ${PORT} se expanda en runtime
ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT:-8083} -jar app.jar"]
