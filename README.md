# Alaya Core PMS (Property Management System)

Alaya Core PMS is an enterprise-grade ERP solution designed for hotels, resorts, restaurants, and other hospitality service entities.

---

## Repository Structure

This repository is organized as a monorepo containing both the frontend and backend applications:
* **[frontend-app/](frontend-app/)**: The standalone Angular frontend client featuring the Admin portals (Dashboard, Housekeeping boards, Guest Registry, Restaurant Billing) and the Guest Storefront portal.
* **[backend-app/](backend-app/)**: The Quarkus Java REST API backend connecting to a PostgreSQL database for authentication and session token validation.

---

## 💻 Frontend Application (Angular)

### Key Features
- **Guest Registry (Check-In/Out)**: Manual room check-ins with prepaid logs and simulated ID attachments. Aggregated invoice checkout settlement.
- **KOT Restaurant System**: Segregated table/suite waiter ordering with specific delivery date-time selections and kitchen preparation Kanban monitoring.
- **Restaurant Billing**: Direct payment settling or charging bills straight to hotel guest room tabs.
- **Staff Directory, Housekeeping Board, Inventory PO Simulator, & Finance Ledgers**.

### Getting Started
1. Navigate to the frontend directory:
   ```bash
   cd frontend-app
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the local development server:
   ```bash
   npm run start
   ```
4. Open your browser to `http://localhost:4200/`.

*Note: You can log in using preset quick-fill buttons for **Receptionist, Captain, Biller, Admin, Chef, Housekeeper, or Guest**.*

---

## ☕ Backend Application (Quarkus REST API)

### Key Features
- **Register Endpoint (`POST /api/auth/register`)**: Inserts new user profiles.
- **Login Endpoint (`POST /api/auth/login`)**: Validates credentials and generates database-backed session tokens.
- **Secured Endpoint (`GET /api/test`)**: Uses JAX-RS Filters to inspect Bearer tokens and return protected user principal metadata.

### Configuration
Update the PostgreSQL datasource details in [application.properties](backend-app/src/main/resources/application.properties):
```properties
quarkus.datasource.db-kind=postgresql
quarkus.datasource.username=postgres
quarkus.datasource.password=postgres
quarkus.datasource.jdbc.url=jdbc:postgresql://localhost:5432/postgres
```

### Getting Started
1. Make sure a PostgreSQL database is running on port `5432`.
2. Navigate to the backend directory:
   ```bash
   cd backend-app
   ```
3. Start the application in Quarkus Dev Mode (auto-recompiling):
   ```bash
   mvn quarkus:dev
   ```
4. Exposes JAX-RS REST endpoints on `http://localhost:8080/`.
