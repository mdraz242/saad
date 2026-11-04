# Betongportalen (The Concrete Portal)
### Production-Ready Concrete & Construction Material Quotation Platform

**Betongportalen** is a Scandinavian SaaS web application designed for concrete and construction material sourcing. It connects private individuals and commercial contractors with vetted regional concrete batching plants, eliminating the need for dozens of phone calls and negotiating wholesale volume prices.

---

## 🏗️ Architecture & Technology Stack

### Frontend
- **Framework**: React 18 / 19 with TypeScript and Vite
- **Styling**: Tailwind CSS with custom Scandinavian design system (Shopify-inspired minimalism: clean light-grey and crisp white backgrounds, `#1a382b` Nordic spruce green accents, rounded cards, rectangular inputs)
- **Routing**: React Router DOM (v6)
- **Icons**: Lucide React
- **Real-Time Client**: Socket.IO client

### Backend
- **Runtime**: Node.js & Express with TypeScript
- **Database & ORM**: PostgreSQL / SQLite via Prisma ORM
- **Security & Auth**:
  - Staff: bcryptjs password hashing + JWT session authentication + Server-side RBAC (`EMPLOYEE`, `ADMINISTRATOR`)
  - Customer: Cryptographically secure unpredictable case references (`BP-2026-XXXXXX`) + Single-use 6-digit Email OTP verification with 10-minute expiry + short-lived session tokens
- **Real-Time Engine**: Socket.IO server for instant two-way chat synchronization
- **Quotation PDF Generator**: Vector PDF generation with `pdfkit`
- **Validation**: Strict schema validation with Zod
- **Email Service**: Transactional email dispatcher with built-in audit log and Admin Email Inspector

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- Node.js (v18+)
- npm

### 2. Backend Setup
```bash
cd backend
npm install
npx prisma db push
npx tsx src/seed.ts
npm run dev
```
*Backend runs on: `http://localhost:5001`*

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on: `http://localhost:5173`*

---

## 🔑 Test Credentials & Demo Cases

### Staff Administration Area
- **URL**: [http://localhost:5173/admin/login](http://localhost:5173/admin/login)
- **Administrator**:
  - Email: `admin@betongportalen.se`
  - Password: `admin12345`
  - Capabilities: Full access to Case Inbox, Quotations, Products, Staff management, Settings & Email logs.
- **Concrete Specialist (Employee)**:
  - Email: `erik.svensson@betongportalen.se`
  - Password: `staff12345`
  - Capabilities: Manage cases, update status, chat with customers, create and issue quotations.

### Seeded Sample Cases for Immediate Testing
1. **Case 1 (Quotation Issued & Two-Way Chat)**:
   - Case Reference: `BP-2026-X89K2P`
   - Customer: Nordic Bygg & Anläggning AB (`lars.johansson@nordicbygg.se`)
   - Product: 32 m³ Ready-mix concrete C30/37 + 24m Boom pump
   - Status: `QUOTATION_SENT` (Quotation v1 issued: 64,000 SEK incl. VAT)
   - Features: Active two-way chat history, PDF quotation download, Accept/Decline decision buttons.

2. **Case 2 (Compare My Quote Workflow)**:
   - Case Reference: `BP-2026-M43R7Y`
   - Customer: Karin Nilsson (`karin.nilsson@gmail.com`)
   - Product: 14 m³ Semi-dry concrete (Jordfuktig)
   - Status: `NEW`
   - Features: Text-based quote comparison data (competing price 28,500 SEK) without requiring file upload.

---

## 📋 End-to-End Acceptance Checklist (Verification)

| # | Requirement | Implementation Status |
|---|---|---|
| **01** | New visitor can submit complete three-step request & receive unique case number | ✅ Fully functional with progress bar, validation, and unpredictable reference format (`BP-2026-XXXXXX`) |
| **02** | "Compare my quote" works through text fields without file upload | ✅ Fully implemented in Step A with price, quantity, terms, and description fields |
| **03** | Refreshing or reopening public site does NOT automatically restore earlier customer case | ✅ Strictly enforced: access is server-verified per session; no permanent auto-restore |
| **04** | Customer can open case only after entering case number + email verification code | ✅ Dedicated Find Your Case flow with masked email hint and 6-digit single-use OTP |
| **05** | Incorrect or expired verification codes do not grant access | ✅ Verified with bcrypt hash, 10-minute expiry, and max 5 failed attempts limit |
| **06** | New request appears in secure staff inbox and can be found with search/filter | ✅ Filter by status, customer type, search by ref/name/email, and sorting |
| **07** | Staff can accept, decline or edit request; customer sees relevant status updates | ✅ Accept for processing, decline with customer-visible reason, request more info, edit request |
| **08** | Staff and customer can exchange messages within the same case | ✅ Chronological two-way chat with instant delivery and customer email notification |
| **09** | Staff can create quote, see correct totals, and generate matching PDF | ✅ Real-time calculation of subtotal, 25% VAT, grand total, and downloadable PDF via PDFKit |
| **10** | Customer can accept or decline quotation version and result is saved | ✅ Modal confirmation, immutable quotation versioning, and status update |
| **11** | Essential transactional email notifications work without exposing private data | ✅ Dispatched emails logged and viewable in Admin Email Inspector (`/admin/settings`) |
| **12** | Case can be closed, outcome recorded, and responsive on mobile/desktop | ✅ Case closure with notes, responsive Scandinavian design across all viewport sizes |

---

## 🐳 Production Deployment with Docker Compose & PostgreSQL

To run the complete production environment using PostgreSQL and Nginx:
```bash
docker-compose up --build -d
```
Services started:
- `betongportalen-postgres`: PostgreSQL 16 on port `5432`
- `betongportalen-backend`: Node.js Express API on port `5001`
- `betongportalen-frontend`: Nginx serving optimized React build on port `5173`

The PostgreSQL schema file is located at `backend/prisma/schema.postgresql.prisma`.

---

## 🔒 Security & GDPR Architecture
- **Unpredictable References**: 6 cryptographically generated alphanumeric characters (`BP-2026-XXXXXX`), preventing enumeration.
- **Short-Lived OTPs**: Expire after 10 minutes, single-use only, brute-force rate-limited.
- **Zero Session Leakage**: Customer access tokens are stored in tab memory only, preventing shared device snooping.
- **Role-Based Server Authorization**: Ordinary employees cannot access administrator settings, staff creation, or system credentials.
- **Version Immutability**: Whenever a quotation is revised, a new version (v2, v3) is created; previous customer acceptances/rejections cannot be modified or erased.

