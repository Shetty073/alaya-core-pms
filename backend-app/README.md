# Alaya Core PMS - Backend REST API

This is the Maven-based Quarkus Java application representing the backend of the Alaya Core PMS solution. It exposes database-backed JAX-RS REST endpoints for user authentication, registration, session management, and role-based route security.

---

## Technical Stack
- **Framework**: Quarkus 3.15.1 (LTS)
- **REST Engine**: RESTEasy Reactive (`quarkus-resteasy-reactive-jackson`)
- **Database Access**: Hibernate ORM with Panache (`quarkus-hibernate-orm-panache`)
- **Driver**: PostgreSQL JDBC (`quarkus-jdbc-postgresql`)
- **Java Platform**: Java 21+

---

## Configuration

The database connections are set in [application.properties](src/main/resources/application.properties):
```properties
quarkus.datasource.db-kind=postgresql
quarkus.datasource.username=postgres
quarkus.datasource.password=postgres
quarkus.datasource.jdbc.url=jdbc:postgresql://localhost:5432/postgres

# Automatically update PostgreSQL schema tables on startup
quarkus.hibernate-orm.database.generation=update
```

Ensure a PostgreSQL instance is running on port `5432` with a database named `postgres` (or customize the connection URL).

---

## Getting Started

Start the application in dev mode:
```bash
mvn quarkus:dev
```

This starts the REST endpoints on `http://localhost:8080` and enables:
- Live reload of java code modifications.
- Dev UI available at `http://localhost:8080/q/dev/`.
- Automatic PostgreSQL local dev services if no external database is detected.

---

## API Documentation

### 1. Register User
- **Endpoint**: `POST /api/auth/register`
- **Request Body**:
  ```json
  {
    "name": "Front Desk Fiona",
    "email": "receptionist@alaya.com",
    "password": "password123",
    "role": "receptionist"
  }
  ```
- **Response**: `201 Created` with user JSON details.

### 2. Login & Session Creation
- **Endpoint**: `POST /api/auth/login`
- **Request Body**:
  ```json
  {
    "email": "receptionist@alaya.com",
    "password": "password123"
  }
  ```
- **Response**: `200 OK` with JSON:
  ```json
  {
    "token": "468e82ef-5f65-4f4b-bd29-a1b7ad7884eb",
    "name": "Front Desk Fiona",
    "email": "receptionist@alaya.com",
    "role": "receptionist"
  }
  ```

### 3. Secured Test Route
- **Endpoint**: `GET /api/test`
- **Requirements**: Requires header `Authorization: Bearer <token_value>` from login.
- **Security Interception**: Handled by JAX-RS `AuthenticationFilter` querying active sessions in PostgreSQL.
- **Response**: `200 OK` with success details, or `401 Unauthorized` for missing/expired session tokens.
