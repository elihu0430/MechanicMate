# 1.1 - Tri-Tier Master Architecture (Next.js 16 + FastAPI + Trigger.dev)


# 🚀 MechanicMate: Tri-Tier System Architecture (Next.js 16 • FastAPI • Trigger.dev)

> 💡 **Note:** **Module:** Tri-Tier Architecture & Step 4 Responsibility Design  

> 💡 **Note:** **Workspace:** JO's Space — MechanicMate Architecture Wiki  

> 💡 **Note:** **Tier 1:** Next.js 16 (App Router, React 19, Tailwind CSS v4, Clerk Auth)  

> 💡 **Note:** **Tier 2:** FastAPI Backend (Python 3.12+, SQLAlchemy 2.0 Async, Native WebSockets, Pydantic v2)  

> 💡 **Note:** **Tier 3:** Trigger.dev v3 (Durable Background Jobs, Auto-Retries, Nightly Cron, WhatsApp Delivery)  

> 💡 **Note:** **Data Tier:** Neon Serverless PostgreSQL (15 Relational Tables)  

> 💡 **Note:** **Date:** September 2026  


---


## 📌 Executive Architecture Summary

MechanicMate organizes its runtime responsibilities across three decoupled, high-performance tiers backed by a shared serverless database:

```plain text
+-------------------------------------------------------------------------------------------------+
|                         TIER 1: PRESENTATION & CLIENT (Next.js 16 + React 19)                   |
|   • Tailwind CSS v4 Dark Automotive UI (4-Pill Kanban Board, 2D SVG Damage Pin Mapper, POS)     |
|   • Web Bluetooth API (ELM327 OBD-II Sensor PIDs) & HTML5 Camera API (Walkaround Photos)        |
|   • Zero-Login Customer Portal (/portal/:token) & Digital Signature Capture                     |
+-------------------------------------------------------------------------------------------------+
                                                │
                                                │ REST API (Clerk JWT) & WebSockets
                                                ▼
+-------------------------------------------------------------------------------------------------+
|                       TIER 2: CORE BUSINESS LOGIC & TELEMETRY (FastAPI Python)                  |
|   • Sub-15ms Plate-First Vehicle Lookups (B-Tree indexed queries via asyncpg)                   |
|   • Native WebSockets (/ws/obd, /ws/workshop) for live PIDs & shop Kanban progress bar          |
|   • Python Decimal Financial Engine (15% VAT, Tiered Markups, Split POS Payments)               |
|   • WeasyPrint / ReportLab PDF Engine (Printable A4 VAT Tax Invoices & DVI Reports)             |
+-------------------------------------------------------------------------------------------------+
                                                │
                                                │ Enqueue Tasks (<20ms) & Cron Schedule
                                                ▼
+-------------------------------------------------------------------------------------------------+
|                     TIER 3: BACKGROUND ORCHESTRATION & RESILIENCE (Trigger.dev v3)              |
|   • WhatsApp Cloud API Dispatcher with 5x Exponential Backoff Retries (Auto-healing 429s)       |
|   • Nightly Scheduled Maintenance Cron (0 20 * * *) scanning odometers & sending reminders      |
|   • Resilient 3rd-Party OEM Scraper (Retrying flaky NHTSA, CarFax & Recall endpoints)           |
|   • Live Visual Observability Dashboard & Telemetry Trace                                       |
+-------------------------------------------------------------------------------------------------+
                                                │
                                                │ SQLAlchemy 2.0 Async / Direct Queries
                                                ▼
+-------------------------------------------------------------------------------------------------+
|                            DATA TIER (Neon Serverless PostgreSQL)                               |
|   • 15 Relational Tables with Composite B-Tree Indexes                                          |
|   • Row-Level Workshop Isolation (WHERE workshop_id = current_user.workshop_id)                 |
|   • Auto-Suspending Compute (Zero idle costs when workshop closes)                              |
+-------------------------------------------------------------------------------------------------+
```


---


## 🎯 Step 4 Responsibility Matrix: Operational Ownership

| Responsibility | Next.js 16 (Tier 1) | FastAPI Backend (Tier 2) | Trigger.dev (Tier 3) |

| :--- | :---: | :---: | :---: |

| **Mechanic Touch UI & Job Board** | ✅ **Primary Owner** | ❌ (REST Only) | ❌ |

| **Plate-First DB Queries (`<15ms`)** | ❌ (Client Fetch) | ✅ **Primary Owner** | ❌ |

| **Live OBD-II Bluetooth WebSockets** | ❌ (Client BLE) | ✅ **Primary Owner** | ❌ |

| **Financial Math & Decimal VAT** | ❌ (Display Only) | ✅ **Primary Owner** | ❌ |

| **WhatsApp Message Delivery** | ❌ (Trigger Button) | ❌ (Token Creator) | ✅ **Primary Owner** |

| **Nightly Scheduled Reminders (Cron)**| ❌ (View Logs) | ❌ (Data Query) | ✅ **Primary Owner** |

| **Retry Flaky 3rd-Party OEM APIs** | ❌ (Badges) | ❌ (Data Cache) | ✅ **Primary Owner** |

| **Visual Logs & Execution Telemetry**| ❌ | ❌ | ✅ **Primary Owner** |


---


## 🔄 End-to-End Operational Flow & Sequence

1. **Intake (`<15ms`):**
- Mechanic types South African registration plate (`ABC 123 GP`).
- Next.js calls `GET /api/v1/intake/lookup?reg_num=ABC123GP`.
- FastAPI verifies Clerk JWT, extracts `workshop_id`, and queries Neon PostgreSQL. Returning specs, past ROs, and client discounts load in $< 15\text{ms}$.
1. **DVI & Live Telemetry:**
- Mechanic performs 32-point DVI and plugs ELM327 Bluetooth adapter.
- Browser streams live PIDs to `ws://api/ws/obd/{vehicle_id}`. FastAPI broadcasts live metrics to all garage screens.
1. **Estimate & WhatsApp Dispatch:**
- Mechanic taps *"Send Quote"*. Next.js enqueues `dispatchWhatsAppQuoteTask` to **Trigger.dev** in $<20\text{ms}$.
- Trigger.dev calls the Meta WhatsApp Cloud API. If Meta rate-limits (HTTP 429), Trigger.dev automatically pauses and retries with exponential backoff (2s &rarr; 4s &rarr; 8s &rarr; 16s).
1. **Customer Approval:**
- Customer opens tokenized `/portal/[token]` link on WhatsApp, reviews photos, and authorizes via digital signature.
- FastAPI broadcasts an instant status change to the workshop Kanban board via WebSocket.
1. **POS Checkout:**
- When work is completed, technician logs payment via Quick POS modal (Cash, Card, EFT, Split).
- FastAPI updates invoice status to `Paid` and generates an A4 VAT Tax Invoice PDF via `WeasyPrint`.
1. **Nightly Automated Retention (Cron):**
- Every night at 20:00, **Trigger.dev** runs `nightlyServiceReminders` cron, scans odometers in Neon DB, and dispatches automated WhatsApp service reminders to vehicle owners.
