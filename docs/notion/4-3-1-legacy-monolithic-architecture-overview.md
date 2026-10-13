# 4.3.1 - Legacy Monolithic Architecture Overview

> 🧭 **Note:** 🏠 [Main Architecture Hub](https://notion.so/3df968d84bdf80c1aae3e239eb52e38d)   |   ➡️ Next: [02 - Next.js 15 File Routing & Components](https://notion.so/3e0968d84bdf81b6934dc43f5e44ea69)


# 🏗️ Module 01: System Overview & Architecture

> 📋 **Note:** Working notes, architectural requirements, and foundational design principles for MechanicMate — a streamlined workshop management system.


## 1. Architectural Requirements & Overview

- Framework: Next.js 15 (App Router) + React 19.
- Database: Neon Serverless PostgreSQL with HTTP connection pooling.
- ORM: Drizzle ORM (type-safe queries & migrations).
- Authentication: Clerk Multi-Tenant + Google OAuth 2.0.
- Styling: Tailwind CSS v4 with dark automotive aesthetic.

## 2. What Needs to Be Done

MechanicMate provides independent auto mechanics with an ultra-fast, mobile-friendly platform to record customer intakes, look up vehicles by registration number plate, manage multi-step repair orders, and generate printable invoice reports in seconds.


## 3. Where Configurations Are Made & What Is Being Configured

| Configuration Area | Location | What Is Being Configured | Role / Purpose |
| --- | --- | --- | --- |
| App Configuration | package.json, next.config.ts | Next.js 15, React 19, TypeScript dependencies | Runtime baseline & compiler rules |
| Database Connection | .env.local (DATABASE_URL) | Neon pooled connection string | Enables serverless HTTP database queries |
| Auth Middleware | middleware.ts | Clerk authentication route protection | Guarantees only authenticated mechanics access dashboard |
| Visual Styling | src/index.css | Tailwind CSS v4 @import 'tailwindcss' | High-contrast dark UI optimized for workshop tablets/phones |


## 4. How It Works (End-to-End System Flow)

```plain text
+-------------------------------------------------------------------------+
|                        MECHANICMATE WORKSHOP CLIENT                     |
|           (Mobile PWA & Desktop Browser — Tailwind CSS v4 Dark UI)      |
+-------------------------------------------------------------------------+
       |                                                |
       | React Server Components (RSC)                  | Direct Form Mutations
       | Dynamic HTML Streaming                         | Server Actions ("use server")
       v                                                v
+------------------------------------+   +--------------------------------+
|        NEXT.JS 15 APP ROUTER       |   |      SERVER ACTIONS LAYER      |
|  - Server Component Data Fetching  |   |  - Zod Input Validation        |
|  - Edge-Ready Layouts & Shells     |   |  - Clerk Tenant Verification   |
|  - Dynamic Route Handlers (APIs)   |   |  - revalidatePath() Cache Bust |
+------------------------------------+   +--------------------------------+
                   \                                    /
                    \                                  /
                     v                                v
    +------------------------------------------------------------------+
    |                    DRIZZLE ORM DATA ACCESS LAYER                 |
    |         (Type-Safe Queries & Auto-Generated Relational Schema)   |
    +------------------------------------------------------------------+
                                     |
                                     | HTTP Connection Pooler (neon-http)
                                     v
    +------------------------------------------------------------------+
    |                 NEON SERVERLESS POSTGRESQL CLOUD                 |
    |     - Instant Branching (Dev/Staging/Production)                 |
    |     - Zero Cold-Starts via HTTP Driver                           |
    |     - Auto-Suspending Compute (Zero Idle Costs)                  |
    |     - 8 Relational Tables (Workshops, Users, Vehicles, etc.)     |
    +------------------------------------------------------------------+
```


## 5. Why It Has Been Done (Architectural Justification)

- 🚫 Zero Cloud Storage: All data is structured text and numbers stored in PostgreSQL. Zero S3/Blob storage costs or upload complexity.
- 🚪 Zero Customer Portal Overhead: Customers receive direct WhatsApp summaries and printable PDF invoices; no customer login management or password reset friction.
- 🚗 License Plate Verification: Typing an indexed number plate (e.g. 'ABC 1234 GP') is 5x faster and far more reliable in a greasy workshop than camera VIN barcode scanners.

---

> 🧭 **Note:** 🏠 [Main Architecture Hub](https://notion.so/3df968d84bdf80c1aae3e239eb52e38d)   |   ➡️ Next: [02 - Next.js 15 File Routing & Components](https://notion.so/3e0968d84bdf81b6934dc43f5e44ea69)

