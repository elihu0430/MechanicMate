# 1.2 - 9-Stage Operational Lifecycle & 4-Pill State Machine


# 🏗️ MechanicMate: System Architecture & Operational Workflow

> 💡 **Note:** **Module:** System Architecture & Operational Lifecycle  

> 💡 **Note:** **Workspace:** JO's Space — MechanicMate Architecture Wiki  

> 💡 **Note:** **Target Framework:** Next.js 16 (App Router) • React 19 • Turbopack  

> 💡 **Note:** **Database:** Neon Serverless PostgreSQL • Drizzle ORM  

> 💡 **Note:** **Authentication:** Clerk Multi-Tenant Auth (Workshop RBAC)  

> 💡 **Note:** **Styling:** Tailwind CSS v4 Dark Automotive Theme  

> 💡 **Note:** **Date:** September 2026  


---


## 📌 Executive Summary

**MechanicMate** is an enterprise-grade automotive Shop Management System (SMS) and vehicle intelligence platform designed for independent repair shops, mobile mechanics, and commercial fleet garages.

Unlike generic invoicing software, MechanicMate is engineered around the physical realities of an automotive workshop:

- **🏎️ Plate-First Intake:** Instant South African registration (`regNum`) lookup connecting vehicles, prior repair histories, and client profiles in $< 20\text{ms}$.
- **🔍 Digital Vehicle Inspections (DVI) & 2D Body Damage Mapping:** Interactive SVG wireframe coordinate pin-drops ($(X\%, Y\%)$) paired with a 32-point inspection matrix and 50-photo multi-media audit to eliminate customer damage claims.
- **⚡ 3 C's Diagnostics & Wireless OBD-II Scanning:** Web Bluetooth ELM327 integration streaming real-time sensor PIDs and Diagnostic Trouble Codes (DTCs) with 1-click repair order conversion.
- **🧠 7-Service OEM Vehicle Intelligence Suite:** Live manufacturer telemetry including Technical Service Bulletins (TSBs), safety recalls, interval-specific maintenance schedules, and probabilistic DTC fix rankings.
- **📋 4-Pill Job Board & Fast POS:** High-contrast workflow board (`Created` ➔ `WIP` with live % completion bar ➔ `Completed` ➔ `Due`) with instant POS checkout and zero-login customer portals over WhatsApp.

---


## 🏛️ System Architecture Topology

MechanicMate operates across a 3-tier cloud architecture with browser-native hardware interfaces and external OEM telemetry links.


### Architecture Overview

```plain text
+-------------------------------------------------------------------------------------------------+
|                                 CLIENT TIER (Mobile PWA & Desktop)                              |
|   • React 19 Client Components • Tailwind CSS v4 Dark Automotive UI                             |
|   • Web Bluetooth API (ELM327 OBD-II live PIDs)                                                 |
|   • HTML5 Camera API (capture="environment", client-side WebP compression)                      |
|   • Interactive 2D SVG Body Damage Mapper (Normalized X%, Y% Coordinate Pin-Drops)              |
|   • Zero-Login Customer Portal (/portal/:token)                                                 |
+-------------------------------------------------------------------------------------------------+
                                                │
                                                │ HTTPS / WSS / Server Actions ("use server")
                                                ▼
+-------------------------------------------------------------------------------------------------+
|                                APPLICATION TIER (Next.js 16 App Router)                         |
|   • Turbopack Compiler & Async Request APIs                                                     |
|   • React Server Components (SSR & Edge Streaming HTML)                                         |
|   • Clerk Multi-Tenant Authentication (Workshop Organizations, Roles & RBAC)                     |
|   • Type-Safe Server Actions & Zod Request Sanitization                                         |
|   • WhatsApp Dispatch Engine (Cloud API webhooks & wa.me deep-links)                            |
|   • Print & Export Engine (@media print A4 VAT Tax Invoices & Reports)                         |
+-------------------------------------------------------------------------------------------------+
                                                │
                                                │ Drizzle ORM (Type-Safe Query Layer)
                                                ▼
+-------------------------------------------------------------------------------------------------+
|                           DATA TIER (Serverless Database & Blob Storage)                        |
|   • Neon Serverless PostgreSQL with HTTP/2 Connection Pooling                                   |
|   • 15 Relational Tables with Composite B-Tree Indexes                                          |
|   • Auto-Suspending Compute (Zero cost during overnight workshop idle hours)                     |
|   • Cloud Object Storage (Evidence photos, diagnostic PDFs, signed quotes)                      |
+-------------------------------------------------------------------------------------------------+
```


---


## 🗂️ Core Functional Modules (The 4 Quadrants)

```plain text
                            MECHANICMATE CAPABILITIES
                                       │
     ┌──────────────────┬──────────────┴──────────────┬──────────────────┐
     ▼                  ▼                             ▼                  ▼
   WORK               TRACK                        REPORT              SYSTEM
(Operations)       (Finances)                    (Analytics)      (Client & Comms)
 ├── Plate Intake   ├── Inventory Triad           ├── 7 OEM Services ├── Zero-Login Portal
 ├── Active Board   ├── Parts Markup Engine       ├── Probabilistic  ├── WhatsApp Engine
 ├── 32-Point DVI   ├── Quick POS Payment Modal   │   DTC Ranking    ├── Digital Signature
 ├── SVG Pin Mapper ├── Multi-Payment Split       ├── TSB & Recalls  └── A4 Print Engine
 └── 3 C's / OBD-II └── VAT & Financial Overrides └── Shop KPIs
```


### 1. WORK (Operational Core)

- **Active Job Cards (Repair Orders):** 4-pill progression (`Created` ➔ `WIP` ➔ `Completed` ➔ `Due`). In `WIP`, an interactive progress bar tracks `(completed_tasks / total_tasks) * 100%`.
- **Plate-First Vehicle Intake (`regNum`):** Fast lookup for returning customer vehicles. Pulls full service history, specs, and owner profiles in under 20ms.
- **32-Point DVI Matrix:** 6-system inspection checklist (Engine, Brakes, Tires, Suspension, Electrical, Underbody) with 🟢 Good, 🟡 Fair, 🔴 Poor states and physical measurements (mm, PSI, CCA).
- **2D SVG Body Damage Mapping:** Interactive coordinate pin drops on Front, Rear, Top, Left, and Right vehicle wireframes to record pre-service damages (Dents, Scratches, Cracks, Hail, Rust) and protect against false damage claims.
- **3 C's Diagnostics & Hardware OBD-II:** Structured problem solving (**Concern**, **Cause**, **Correction**) linked directly to Web Bluetooth ELM327 live sensor telemetry and DTC fault codes (`P0300`, `P0420`, etc.).

### 2. TRACK (Finances & Inventory)

- **Inventory Triad:** 3 inventory vectors: Standard Parts, Dimensioned Tires (Width / Ratio / Rim / Speed index), and Canned Labor Packages.
- **Parts Markup Engine:** Live margin and markup tracking with automatic reorder thresholds.
- **Quick "Mark as Paid" POS:** Low-friction payment modal supporting Cash, Card Terminal, EFT / Bank Transfer, and Account Credit. Supports split payments.
- **Client Financial Overrides:** Custom VIP/Fleet settings: Tax-exempt toggles (0% VAT), negotiated hourly labor rates, capped parts markup tiers, and flexible payment terms (COD, Net 15, Net 30, Net 60).

### 3. REPORT & INTELLIGENCE (Analytics & OEM Diagnostics)

- **7-Service OEM Intelligence Suite:**
1. *Repair Report:* Statistically validated DTC fix rankings (up to 99% certainty).
1. *Maintenance Schedule:* Factory services due within $\pm 10,000\text{ miles}$ / $15,000\text{ km}$ of odometer.
1. *Full Maintenance Roadmap:* Lifetime OEM service schedules (0 to 300,000+ km).
1. *Upcoming Maintenance:* 12-month predictive component failure modeling.
1. *Technical Service Bulletins (TSB):* Factory repair procedures for known defects.
1. *Safety Recalls:* Mission-critical manufacturer safety recall tracking.
1. *Warranty Status:* Active factory bumper-to-bumper and powertrain coverage.
- **1-Click "Add to Job Card":** Direct conversion bridge from OEM recommendations and failed DVI points into billable job card line items.

### 4. SYSTEM (Client Experience & Communications)

- **Zero-Login Customer Portal (`/portal/[token]`):** Tokenized, password-free client web portal sent via SMS or WhatsApp for quote review, photo evidence inspection, and digital signature authorization.
- **WhatsApp Dispatch Engine:** Pre-templated WhatsApp message generation for quotes, job completion notices, and payment receipts.
- **A4 Print Engine:** CSS `@media print` layout for physical job cards, technician task sheets, and official VAT tax invoices.

---


## 🔄 End-to-End Operational Workflow

```plain text
[1. Vehicle Arrival & Plate Intake]
  │  • Mechanic enters South African plate (e.g. "ABC 123 GP")
  │  • Returning vehicle: specs and past service records load in <20ms
  │  • New vehicle: VIN scan and customer onboarding
  ▼
[2. Pre-Service DVI & 2D Body Damage Mapping]
  │  • Mechanic performs walkaround; captures up to 50 photos
  │  • Drops SVG coordinate pins (X%, Y%) for pre-existing scratches/dents
  │  • Evaluates 32-point inspection matrix (🟢 Good / 🟡 Fair / 🔴 Poor)
  ▼
[3. Wireless OBD-II Diagnostics & OEM Telemetry]
  │  • Connects Web Bluetooth ELM327 adapter
  │  • Scans live PIDs (RPM, Coolant Temp, Fuel Trims) & DTC codes
  │  • Logs 3 C's (Concern, Cause, Correction)
  │  • Queries OEM TSBs, Recalls & Maintenance Schedule
  ▼
[4. Estimate Compilation & Customer Authorization]
  │  • 1-Click converts failed DVI items and DTCs to repair order
  │  • Applies client financial overrides (tax exemptions, fleet labor rates)
  │  • Dispatches zero-login link (/portal/:token) via WhatsApp
  │  • Customer reviews photo evidence and authorizes via digital signature
  ▼
[5. Active WIP Execution & Job Board]
  │  • Job card moves to "WIP" on workshop Kanban board
  │  • Technician checks off individual labor and parts tasks
  │  • Completion bar dynamically progresses from 0% to 100%
  │  • Road test completed; RO status set to "Completed"
  │  • Automated WhatsApp dispatch: "Your vehicle is ready for collection"
  ▼
[6. Invoicing, POS Checkout & Vehicle Handover]
  │  • Customer arrives for collection
  │  • Technician opens Quick "Mark as Paid" POS modal
  │  • Records payment (Cash, Card, EFT, Split)
  │  • Issues A4 VAT Tax Invoice & digital WhatsApp receipt
```


---


## 🗄️ Relational Database Schema (Neon PostgreSQL • 15 Tables)

| # | Table Name | Purpose | Key Relations & Indexes |

| :-: | :--- | :--- | :--- |

| **1** | `workshops` | Multi-tenant organization profile, VAT & currency settings | Primary tenant entity |

| **2** | `users` | Mechanics, technicians, service advisors | `workshops.id`, Clerk User ID |

| **3** | `customers` | Client directory & financial overrides (tax, discounts, terms) | `workshops.id`, phone, email |

| **4** | `vehicles` | Fleet management, VIN, year/make/model, odometer | `workshops.id`, `customers.id`, indexed on `license_plate` |

| **5** | `repair_orders` | Job cards, status (`Created`, `WIP`, `Completed`, `Due`) | `customers.id`, `vehicles.id`, indexed on `status` |

| **6** | `repair_order_items` | Individual parts, labor hours, sublet repairs | `repair_orders.id`, item type, completed flag |

| **7** | `inventory_items` | Standard parts, tire catalog, and stock counts | `workshops.id`, SKU, reorder threshold |

| **8** | `diagnostic_entries` | 3 C's diagnostic records (Concern, Cause, Correction) | `repair_orders.id`, system category |

| **9** | `obd_scan_records` | Captured OBD-II DTCs, live PIDs, and Freeze Frames | `repair_orders.id`, protocol |

| **10** | `invoices` | Invoices, subtotal, VAT, discounts, total & balance due | `repair_orders.id`, `workshops.id`, status |

| **11** | `payments` | Point-of-sale payment transactions | `invoices.id`, `users.id`, payment method |

| **12** | `inspections` | Digital Vehicle Inspection sessions & sharing tokens | `customers.id`, `vehicles.id`, `repair_orders.id` |

| **13** | `inspection_checklist_items` | 32-point inspection ratings (Good/Fair/Poor) & metrics | `inspections.id`, category |

| **14** | `vehicle_damage_pins` | Interactive SVG pins: perspective, $(X\%, Y\%)$, damage type | `inspections.id`, `vehicles.id` |

| **15** | `inspection_attachments` | Photo evidence & PDF diagnostic reports | `inspections.id`, media URL |


---


## 💡 Key Design Rules & Standards

- **Currency:** South African Rand (`ZAR`, e.g. `R 3,050`).
- **VAT Rate:** Default 15.00% (with per-customer 0% tax-exempt override).
- **Labor Rate:** Default R 480.00 / hour (with fleet override support).
- **Color Palette:**
- Background: `#0a0a0a`
- Surface: `#141414`
- Card: `#1a1a1a`
- Primary Accent: `#22c55e` (Emerald Green)
- Warning / WIP: `#f59e0b` (Amber)
- Danger / Due: `#ef4444` (Crimson)
- Info / Scheduled: `#38bdf8` (Sky Blue)
