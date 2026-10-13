# 1.3 - FastAPI Backend Architecture & WebSockets Engine


# ⚡ MechanicMate: FastAPI Backend Architecture & Operational Flow

> 💡 **Note:** **Module:** FastAPI Backend & Next.js 16 Client Architecture  

> 💡 **Note:** **Workspace:** JO's Space — MechanicMate Architecture Wiki  

> 💡 **Note:** **Backend Stack:** FastAPI (Python 3.12+, Uvicorn, ASGI) • SQLAlchemy 2.0 Async • Alembic • Pydantic v2  

> 💡 **Note:** **Frontend Stack:** Next.js 16 (App Router, React 19, Tailwind CSS v4)  

> 💡 **Note:** **Database:** Neon Serverless PostgreSQL (asyncpg pool, 15 relational tables)  

> 💡 **Note:** **Authentication:** Clerk Multi-Tenant Auth with JWT validation in FastAPI  

> 💡 **Note:** **Real-Time Layer:** Native WebSockets for OBD-II PIDs and Live WIP Kanban Sync  

> 💡 **Note:** **Date:** September 2026  


---


## 📌 Executive Summary

MechanicMate decouples its architecture into:

1. A **Next.js 16 (App Router & React 19)** frontend client providing server-rendered pages, Clerk authentication sessions, and mobile-first touch UI.
1. A high-performance **Python FastAPI backend** executing business logic, hardware telemetry streaming, OEM data integration, high-precision financial calculations, and PDF generation.
1. A **Neon Serverless PostgreSQL** database accessed asynchronously via **SQLAlchemy 2.0** and **asyncpg**.

---


## 🏛️ System Architecture Topology

```plain text
+-------------------------------------------------------------------------------------------------+
|                                 CLIENT TIER (Mobile PWA & Desktop)                              |
|   • Next.js 16 (App Router & React 19) • Tailwind CSS v4 Dark UI                                |
|   • Web Bluetooth API (ELM327 OBD-II live PIDs)                                                 |
|   • HTML5 Camera Capture (WebP Photos)                                                          |
|   • Zero-Login Customer Portal (/portal/:token)                                                 |
+-------------------------------------------------------------------------------------------------+
                                                │
                                                │ REST API (Bearer JWT) & WebSockets
                                                ▼
+-------------------------------------------------------------------------------------------------+
|                                BACKEND TIER (Python FastAPI + ASGI)                             |
|   • APIRouter Modular Endpoints (/api/v1/intake, /jobs, /inspections, /invoices, /pos)          |
|   • Clerk JWKS Multi-Tenant JWT Verification (org_id workshop isolation)                        |
|   • Native WebSockets (Live OBD-II sensor PIDs & workshop Kanban progress bar broadcast)       |
|   • Pydantic v2 DTOs (Request & Response validation with Decimal currency precision)            |
|   • WeasyPrint / ReportLab Engine (Printable A4 VAT tax invoices & DVI inspection reports)      |
+-------------------------------------------------------------------------------------------------+
                                                │
                                                │ SQLAlchemy 2.0 Async (asyncpg pool)
                                                ▼
+-------------------------------------------------------------------------------------------------+
|                            DATA TIER (Neon Serverless PostgreSQL)                               |
|   • 15 Relational Tables with Composite B-Tree Indexes                                          |
|   • Row-Level Workshop Multi-Tenancy (WHERE workshop_id = current_user.workshop_id)             |
|   • Auto-Suspending Compute (Zero idle costs when workshop closes)                              |
+-------------------------------------------------------------------------------------------------+
```


---


## 🔄 End-to-End Operational Flow & FastAPI Request Lifecycle

```plain text
[1. Vehicle Arrival & Plate Intake]
  │  • Tech types South African plate (e.g. "ABC 123 GP")
  │  • Next.js calls: GET /api/v1/intake/lookup?reg_num=ABC123GP
  │  • FastAPI validates Clerk JWT, extracts workshop_id, queries Neon DB
  │  • Returning vehicle specs, past ROs, and client overrides load in < 15ms
  ▼
[2. Pre-Service DVI & 2D Body Damage Mapping]
  │  • Tech conducts 32-point inspection & drops SVG pins on wireframe
  │  • Next.js calls: POST /api/v1/inspections
  │  • FastAPI saves checklist items, photo URLs, and normalized (X%, Y%) pins
  ▼
[3. Wireless OBD-II Hardware Diagnostics]
  │  • Tech connects ELM327 Bluetooth OBD dongle
  │  • Browser opens WebSocket: ws://api/ws/obd/{vehicle_id}
  │  • Live PIDs (RPM, Coolant Temp, Voltage) and DTCs stream at 50ms intervals
  │  • FastAPI matches DTCs (e.g. P0300) against OEM database for ranked fixes
  ▼
[4. Estimate Compilation & Customer Authorization]
  │  • 1-Click converts failed DVI points and DTCs to repair order
  │  • Next.js calls: POST /api/v1/jobs/from-inspection/{id}
  │  • FastAPI computes parts markup and labor rates applying client overrides
  │  • Dispatches WhatsApp template with tokenized link: /portal/{token}
  │  • Customer reviews high-res photos and signs quote digitally
  ▼
[5. Active WIP Execution & Workshop Kanban Sync]
  │  • Tech moves Job to "WIP" on workshop board
  │  • As tasks are completed, Next.js calls: PATCH /api/v1/jobs/{id}/items/{item_id}/toggle
  │  • FastAPI recomputes progress % and broadcasts WebSocket event to all shop screens
  │  • Vehicle road tested; status updated to "Completed"
  │  • Automated WhatsApp dispatch: "Your vehicle is ready for collection"
  ▼
[6. Quick POS Checkout, Invoicing & Handover]
  │  • Tech opens Quick "Mark as Paid" modal in Next.js
  │  • Calls: POST /api/v1/invoices/{id}/payments (Cash, Card POS, EFT, Split)
  │  • FastAPI updates balance, records payment transaction, generates A4 PDF
  │  • Issues printable A4 VAT invoice and sends digital receipt via WhatsApp
```


---


## 🗄️ Database Architecture (SQLAlchemy 2.0 Async • 15 Tables)

- **`workshops`**: Multi-tenant organization profile (name, currency ZAR, default VAT 15%, logo).
- **`users`**: Workshop staff (mechanics, technicians, service advisors) mapped to Clerk user IDs.
- **`customers`**: Client directory with VIP/Fleet tags and **financial overrides** (0% VAT, custom labor rate, markup caps, terms).
- **`vehicles`**: Vehicle registry indexed by `reg_num` (license plate), VIN, year, make, model, odometer.
- **`repair_orders`**: Job cards tracking status (`Created`, `WIP`, `Completed`, `Due`), assigned tech, odometer.
- **`repair_order_items`**: Parts, labor hours, tire items, sublet charges with costs, prices, and completion flags.
- **`inventory_items`**: Inventory triad (Standard Parts, Dimensioned Tires, Canned Labor Packages).
- **`diagnostic_entries`**: 3 C's records (**Concern**, **Cause**, **Correction**) linked to repair orders.
- **`obd_scan_records`**: Captured DTC fault codes, live PIDs, and freeze-frame sensor telemetry.
- **`inspections`**: DVI sessions with overall condition rating and customer sharing token.
- **`inspection_checklist_items`**: 32 individual checkpoint results (🟢 Good / 🟡 Fair / 🔴 Poor) with numerical metrics (mm, PSI, CCA).
- **`vehicle_damage_pins`**: Interactive SVG pins: perspective, $(X\%, Y\%)$ coordinates, damage type, photos.
- **`inspection_attachments`**: Up to 50 photo evidence items and PDF diagnostic reports.
- **`invoices`**: Billing documents with calculated subtotal, VAT, discounts, total due, and balance due.
- **`payments`**: Payment ledger recording transaction date, payment method, amount, and reference.

---


## ⚙️ Backend Module Layout

```plain text
backend/
├── app/
│   ├── main.py              # FastAPI app setup, CORS, lifespan
│   ├── config.py            # Pydantic Settings (DB URL, Clerk JWKS)
│   ├── dependencies.py      # Clerk JWT auth & AsyncSession injection
│   ├── api/v1/              # Route controllers (intake, jobs, inspections, invoices, etc.)
│   ├── core/                # Auth, database, exceptions, websockets
│   ├── models/              # SQLAlchemy 2.0 Async declarative models
│   ├── schemas/             # Pydantic v2 DTOs (validation & serialization)
│   └── services/            # Domain logic (pricing math, DVI, POS, WeasyPrint PDF)
├── alembic/                 # Database migrations
└── tests/                   # pytest + httpx test suite
```

