# MechanicMate — System Architecture Hub

> 🛠️ **Note:** Welcome to the MechanicMate Architecture Hub (Next.js 16 + Neon PostgreSQL + Drizzle ORM). Built with feature-parity against industry-standard systems like ARI (Auto Repair Software) with modern web capabilities.


---


## ⚙️ Production Technology Stack

| Layer | Technology | Rationale |
| --- | --- | --- |
| Framework | Next.js 16 (App Router) | Turbopack performance, React 19 Server Components & Actions |
| Language | TypeScript 5.7 | Strict end-to-end type safety from database to UI |
| Styling | Tailwind CSS v4 | High-contrast dark automotive design system |
| Auth & Tenancy | Clerk Multi-Tenant | Organization-level isolation, Google OAuth 2.0 |
| Database | Neon Serverless PostgreSQL | Auto-scaling, auto-suspending, zero-idle-cost database |
| ORM | Drizzle ORM | Type-safe SQL queries, zero runtime overhead |
| Device APIs | Web Bluetooth & MediaDevices | Hardware OBD-II scanning & camera access directly in browser PWA |


---

- Decoupled operational responsibility matrix: Next.js 16 (UI & Web Bluetooth), FastAPI (Sub-15ms REST, WebSockets & Decimal VAT), and Trigger.dev (WhatsApp retries, Nightly Cron & No-Timeout Workers).

📄 **Subpage:** [🚀 Hub 1: System Architecture & Runtime Topology](./hub-1-system-architecture-runtime-topology.md)


📄 **Subpage:** [🏎️ Hub 2: Automotive Domain Specifications & Workflows](./hub-2-automotive-domain-specifications-workflows.md)


📄 **Subpage:** [🗄️ Hub 3: Database Architecture (Neon PostgreSQL)](./hub-3-database-architecture-neon-postgresql.md)


📄 **Subpage:** [🛠️ Hub 4: Setup, Security & Migration Guides](./hub-4-setup-security-migration-guides.md)


---


## 📁 Master Architecture Categories (Consolidated)

> 🚀 **Note:** [**Hub 1: System Architecture & Runtime Topology**](https://notion.so/3e7968d8-4bdf-8133-93cb-c7d1d45e5f44)
Tri-Tier Hybrid Architecture (Next.js 16 + FastAPI + Trigger.dev), 9-Stage Operational Lifecycle, FastAPI WebSockets, and Frontend App Router tree.

> 🏎️ **Note:** [**Hub 2: Automotive Domain Specifications & Workflows**](https://notion.so/3e7968d8-4bdf-811c-86b6-e28f90a50b4e)
32-Point DVI, 2D SVG Body Damage Mapping, 7 OEM Services (TSBs, Recalls, Schedules), 3 C's Diagnostics, Inventory Triad, and A4 VAT Invoicing.

> 🗄️ **Note:** [**Hub 3: Database Architecture (Neon PostgreSQL)**](https://notion.so/3e7968d8-4bdf-8120-acfa-db9d54c35e0e)
15-Table Relational Schema, Composite B-Tree Indexes, Row-Level Multi-Tenancy, and SQLAlchemy 2.0 Async mapped models.

> 🛠️ **Note:** [**Hub 4: Setup, Security & Migration Guides**](https://notion.so/3e7968d8-4bdf-810e-8d25-f7b2d6159954)
Clerk Multi-Tenant Auth with Google OAuth 2.0, Mock-to-Live database audit, and archived legacy specifications.

