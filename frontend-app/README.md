# Alaya Core PMS (Enterprise Property & Hospitality Management Frontend)

This project is the enterprise-grade frontend for the **Alaya Core PMS** Property Management System (ERP for properties, hotels, restaurants, and cabs). Built with **Angular** (Standalone Components) and styled with clean **Vanilla CSS** inspired by GitHub and Oracle PMS designs.

## Core Features
1. **Properties & Assets Console**: Register property branches and manage rooms, dining tables, and cabs.
2. **KOT System**: Digital waiters' order ticket entry and live kitchen display Kanban boards.
3. **Inventory Management**: Live stock levels, low-count warning highlights, and purchase order simulators.
4. **Housekeeping Checklist**: Attendance sheets to delegate and track room cleanliness (dirty, cleaning, clean).
5. **Staff Directory**: Role management (Owner, Receptionist, Chef, Attendant) and module permission checkers.
6. **Finance Ledger**: Invoice generation, account settlements, and profit/loss transaction timelines.
7. **Guest Storefront**: Date-based stay booking, in-room food menu orders, taxi transfers, and billing checkouts.

---

## Predefined Demo Logins

No complex authentication setup is needed. You can log in directly using the preset credentials (or click the quick-fill buttons on the login screen):

- **Admin/Owner**: `admin@alaya.com` (Accesses all modules)
- **Chef/Kitchen**: `chef@alaya.com` (Accesses KOT & Inventory)
- **Housekeeper**: `housekeeper@alaya.com` (Accesses Housekeeping)
- **Guest/Storefront**: `guest@alaya.com` (Accesses Storefront booking/dining)
- *Password for all profiles:* `password123` (or anything matching)

---

## Local Development Server

Run the development server locally:
```bash
npm run start
```
Navigate to `http://localhost:4200/` in your browser. All data modifications are preserved across refreshes via local storage mocks.

## Production Compilations
To compile a production build:
```bash
npm run build
```
Build assets will be saved under the `dist/alaya-core-pms-frontend/` directory.
