# Viju Customer Portal (Web Frontend)

## 1. Project Overview

The **Viju Customer Portal (Web Frontend)** is an internal enterprise dashboard used by Viju staff to manage distributor operations across four regions:

- Lagos
- South West
- South East
- North

The web application serves three primary roles:

- **Account Officers**
- **Regional Admin Managers**
- **Administrators**
- **Loading/Warehouse Officers**

The platform is built to provide real-time operational visibility and workflow management across:

- Distributor account data (ERP-sourced, read-only)
- Wallet balances
- Orders, invoices, stock, and waybills
- Chat and ticketing system
- Loading / logistics lifecycle management
- Broadcast messaging system (regional + individual)
- Audit and compliance tracking

### Key Principle

This is a **read-first operational control system**, not a transactional system.  
ERP remains the system of record.

---

## 2. Project Structure

The web frontend is organized as a **modular monorepo-ready application structure**, optimized for scalability across multiple roles and workflows.

viju-web-portal/
│
├── src/
│ ├── app/ # Next.js App Router pages
│ │ ├── (auth)/ # Login, OTP, session handling
│ │ ├── officer/ # Account Officer dashboard + flows
│ │ ├── regional-admin/ # Regional Admin dashboard + workflows
│ │ ├── admin/ # Administrator full access dashboard
│ │ ├── loading/ # Warehouse / loading officer views
│ │
│ ├── components/
│ │ ├── ui/ # Reusable UI components (buttons, tables, modals)
│ │ ├── layout/ # App shells, navigation, sidebars
│ │ ├── dashboard/ # Dashboard-specific components
│ │ ├── chat/ # Chat UI components
│ │ ├── tickets/ # Ticket management UI
│ │ ├── waybills/ # Waybill & logistics components
│ │ ├── broadcast/ # Broadcast UI modules
│ │
│ ├── features/
│ │ ├── auth/ # ERP login, session management
│ │ ├── distributors/ # Distributor list + detail views
│ │ ├── accounts/ # Account officer workflows
│ │ ├── logistics/ # Loading + waybill flows
│ │ ├── notifications/ # Notification handling system
│ │
│ ├── services/
│ │ ├── api/ # ERP + backend API clients
│ │ ├── websocket/ # Real-time communication layer
│ │ ├── notifications/ # Push + in-app notification handlers
│ │
│ ├── store/ # Global state (Zustand)
│ ├── hooks/ # Custom React hooks
│ ├── utils/ # Helper functions
│ ├── types/ # TypeScript type definitions
│ ├── constants/ # App constants (roles, regions, enums)
│
├── public/
├── styles/
├── middleware.ts # Role-based route protection
├── next.config.js
└── README.md

---

## 3. Project Architecture

The system follows a **role-based, event-driven, API-first architecture**.

### 3.1 High-Level Architecture

            ERP System (Read-Only Source)
                      │
                      ▼
              Backend API Layer
                      │
    ┌─────────────────┼──────────────────┐
    ▼                 ▼                  ▼

Account Officer Regional Admin Administrator
UI UI UI
│
▼
Real-Time Event Layer
(WebSockets + Notifications + Ticket Updates)

---

### 3.2 Core Architectural Principles

#### 1. Role-Based Access Control (RBAC)

The UI is dynamically rendered based on user role:

- Account Officer → assigned distributors only
- Regional Admin → all regional operations
- Administrator → full system access
- Loading Officer → assigned waybill tasks only

Route protection is enforced via middleware.

---

#### 2. ERP-Centric Read-Only Data Model

- ERP is the **single source of truth**
- Frontend does not directly modify ERP records
- Backend API acts as a controlled abstraction layer

---

#### 3. Event-Driven UI Updates

The frontend reacts to real-time events:

- Chat messages
- Ticket updates
- Waybill status changes
- Broadcast messages
- Assignment changes

Implemented via:

- WebSockets for real-time updates
- Notification service for push/in-app alerts

---

#### 4. Region-Scoped Data Access

All queries are automatically scoped based on:

- User role
- Assigned region
- Permissions defined in ERP mapping

No cross-region data leakage is permitted.

---

#### 5. Feature-Driven Modular Design

Each major business domain is isolated:

- Accounts
- Logistics (Waybills)
- Support Tickets
- Chat
- Broadcasts
- Admin Controls

This ensures maintainability and separation of concerns.

---

## 4. Tech Stack

### 4.1 Core Framework

| Technology | Version | Reason for Choice                                          |
| ---------- | ------- | ---------------------------------------------------------- |
| Next.js    | 15.x    | App Router, SSR/CSR hybrid, enterprise routing flexibility |
| React      | 19.x    | Modern concurrent rendering model for complex dashboards   |
| TypeScript | 5.5+    | Strong type safety for large-scale enterprise workflows    |

---

### 4.2 UI & Styling

| Technology   | Version | Reason for Choice                                        |
| ------------ | ------- | -------------------------------------------------------- |
| Tailwind CSS | 3.4+    | Rapid UI development, consistent design system           |
| shadcn/ui    | Latest  | Prebuilt accessible components for enterprise dashboards |

---

### 4.3 State & Data Management

| Technology     | Version | Reason for Choice                                   |
| -------------- | ------- | --------------------------------------------------- |
| TanStack Query | 5.x     | Server-state caching and synchronization            |
| Zustand        | 4.x     | Lightweight global state for UI-level state         |
| Axios          | 1.x     | API abstraction with interceptors for auth + errors |

---

### 4.4 Real-Time Communication

| Technology       | Version | Reason for Choice                             |
| ---------------- | ------- | --------------------------------------------- |
| Socket.io Client | 4.x     | Real-time chat, tickets, and workflow updates |

---

### 4.5 Forms & Validation

| Technology      | Version | Reason for Choice                         |
| --------------- | ------- | ----------------------------------------- |
| React Hook Form | 7.x     | High-performance form handling            |
| Yup             | 3.x     | Schema validation aligned with TypeScript |

---

### 4.6 Tooling & Infrastructure

| Technology           | Reason                                   |
| -------------------- | ---------------------------------------- |
| ESLint               | Code consistency and quality enforcement |
| Prettier             | Standardized formatting                  |
| Turborepo (optional) | Monorepo scalability and caching         |

---

## 5. Assumptions

### 5.1 ERP System

- ERP is external and acts as the **system of record**
- Web frontend is strictly **read-only for ERP data** fetch from the backend
- All updates are mediated via backend services

---

### 5.2 Authentication

- Users authenticate using **ERP username + code**
- No email/password login system
- Password reset handled via OTP (phone/email via backend)

---

### 5.3 Data Integrity

- All stock, and logistics data originates from ERP

---

### 5.4 Communication System

- Chat supports text and image only (no video or voice chat)
- Officers are anonymized to distributors as “Viju Account Officer”
- All chat and ticket data is fully auditable

---

### 5.5 Notifications

- Web notifications are in-app (bell icon) + optional email
- All notifications are event-driven and backend-triggered

---

### 5.6 Platform Constraints

- Desktop-first application (no mobile web requirement)
- English-only interface (v1)
- No voice/audio communication support

---

### 5.7 Scope Limitations (Explicitly Out of Scope)

The frontend does NOT handle:

- Payments or wallet funding logic
- Order creation or modification
- ERP write-back operations
- Multi-language support
- Voice or audio communication
- External loading form processing (URL-based only)

---

## End of Document
