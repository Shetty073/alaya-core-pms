# Multi-stage build for Quarkus backend
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /code

# Copy dependencies manifest to leverage layer caching
COPY pom.xml /code/
RUN mvn dependency:go-offline -B

# Compile and package application
COPY src /code/src
RUN mvn package -DskipTests -B

# Final production runtime image
FROM eclipse-temurin:21-jre-alpine

ENV LANGUAGE='en_US:en'
WORKDIR /deployments

# Run under a secure non-privileged system user
RUN addgroup -S pmsrun && adduser -S pmsrun -G pmsrun -u 185
USER 185

# Copy packaged fast-jar artifacts from builder stage with correct ownership
COPY --from=build --chown=185:185 /code/target/quarkus-app/lib/ /deployments/lib/
COPY --from=build --chown=185:185 /code/target/quarkus-app/quarkus/ /deployments/quarkus/
COPY --from=build --chown=185:185 /code/target/quarkus-app/app/ /deployments/app/
COPY --from=build --chown=185:185 /code/target/quarkus-app/quarkus-run.jar /deployments/quarkus-run.jar

EXPOSE 8080

# Environment configurations for container optimization
ENV JAVA_OPTS="-Dquarkus.http.host=0.0.0.0 -Djava.util.logging.manager=org.jboss.logmanager.LogManager"
ENTRYPOINT [ "sh", "-c", "java $JAVA_OPTS -jar quarkus-run.jar" ]
