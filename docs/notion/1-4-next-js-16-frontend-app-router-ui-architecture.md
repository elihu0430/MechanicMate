# 1.4 - Next.js 16 Frontend App Router & UI Architecture

> 🧭 **Note:** ⬅️ Previous: [01 - System Overview & Architecture](https://notion.so/3e0968d84bdf813c97c1e0cda80014bb)   |   🏠 [Main Architecture Hub](https://notion.so/3df968d84bdf80c1aae3e239eb52e38d)   |   ➡️ Next: [03 - Next.js 15 Server Actions (Mutations & Forms)](https://notion.so/3e0968d84bdf81ce9635c1b6f60f360d)


# 🗂️ Module 02: Next.js 15 File Routing & Components Structure

> 📋 **Note:** Working notes, architectural requirements, and complete directory blueprint for App Router routes, modular components, and the lib layer.


## 1. Architectural Requirements & Overview

- Clean separation between app/ (routing), src/components/ (UI), src/lib/ (logic & DB), and src/actions/ (mutations).
- React Server Components (RSC) by default for direct DB querying and zero JS overhead.
- Client Components ('use client') reserved strictly for interactive state (drawers, search debouncers, optimistic toggles).

## 2. What Needs to Be Done

Structure the repository to support multi-tenant routing, repair order wizards, vehicle directories, printable invoice layouts, and reusable dark-mode UI components.


## 3. Where Configurations Are Made & Directory Map

```plain text
mechanicmate/
├── app/                                       # App Router
│   ├── (auth)/                                # Clerk Authentication Route Group
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   └── sign-up/[[...sign-up]]/page.tsx
│   │
│   ├── (dashboard)/                           # Protected Dashboard Route Group
│   │   ├── layout.tsx                         # Dashboard Shell (Sidebar + TopBar + MobileNav)
│   │   ├── page.tsx                           # Main Dashboard (KPIs & active bay jobs)
│   │   ├── jobs/                              # Repair Orders (ROs)
│   │   │   ├── page.tsx                       # Filterable Jobs Table
│   │   │   ├── new/page.tsx                   # Guided Job Creation Wizard
│   │   │   └── [id]/                          # Repair Order Detail Views
│   │   │       ├── page.tsx                   # Overview & line items
│   │   │       ├── invoice/page.tsx           # Tax Invoice Generator & Payment Recorder
│   │   │       └── report/page.tsx            # Printable Work Completion Report
│   │   ├── customers/                         # Customer Management (CRM)
│   │   │   ├── page.tsx                       # Directory & Search
│   │   │   ├── new/page.tsx                   # Add customer form
│   │   │   └── [id]/page.tsx                  # Profile & vehicle fleet
│   │   ├── vehicles/                          # Vehicle Fleet Registry
│   │   │   ├── page.tsx                       # Search by License Plate
│   │   │   ├── new/page.tsx                   # Vehicle intake form
│   │   │   └── [id]/page.tsx                  # Specs & service timeline
│   │   ├── appointments/                      # Booking & Schedule
│   │   │   └── page.tsx                       # Day / Week timeline
│   │   ├── invoices/                          # Invoicing & Accounting
│   │   │   ├── page.tsx                       # Invoices list (Draft, Paid, Overdue)
│   │   │   └── [id]/page.tsx                  # Detailed invoice view
│   │   └── settings/                          # Workshop Configuration
│   │       └── page.tsx                       # Labour rates, VAT %, Shop profile
│   │
│   ├── api/                                   # Dedicated Route Handlers
│   │   ├── health/route.ts                    # DB connection & latency check
│   │   ├── webhooks/clerk/route.ts            # Clerk user & tenant sync
│   │   └── notifications/whatsapp/route.ts    # WhatsApp notification dispatcher
│   │
│   ├── layout.tsx                             # Root layout, ClerkProvider, ThemeProvider
│   ├── not-found.tsx                          # Custom 404
│   └── error.tsx                              # Error boundary
│
├── src/
│   ├── components/                            # Modular React UI Components
│   │   ├── ui/                                # Primitives: Button, Input, Modal, Badge, Drawer
│   │   ├── navigation/                        # Sidebar, MobileBottomNav, TopBar
│   │   ├── jobs/                              # JobCard, WizardProgress, PartsLabourTable, ROHeader
│   │   ├── vehicles/                          # VehicleCard, LicensePlateLookup, ServiceTimeline
│   │   ├── customers/                         # CustomerCard, CustomerHeader, QuickActionButtons
│   │   ├── invoices/                          # InvoiceCard, PaymentSummary, PrintableReport
│   │   └── appointments/                      # AppointmentCard, DayTimeline, WeekStrip
│   │
│   ├── lib/                                   # Core Business Logic & Infrastructure
│   │   ├── db/                                # Neon Database Connection & Drizzle ORM
│   │   │   ├── index.ts                       # Drizzle client instance (Neon HTTP driver)
│   │   │   ├── schema/                        # Modular table definitions (workshops, vehicles...)
│   │   │   └── migrations/                    # SQL migration scripts generated by drizzle-kit
│   │   ├── auth/                              # Clerk role checks & tenant workshop_id helpers
│   │   ├── validators/                        # Zod schemas (jobs, customers, vehicles, payments)
│   │   └── utils/                             # formatCurrency, date helpers, cn()
│   │
│   └── actions/                               # Next.js Server Actions ("use server")
│       ├── jobs.ts                            # createRepairOrderAction, updateJobStatusAction
│       ├── customers.ts                       # createCustomerAction, updateCustomerAction
│       ├── vehicles.ts                        # registerVehicleAction, lookupVehicleByPlateAction
│       ├── invoices.ts                        # createInvoiceAction, recordPaymentAction
│       └── appointments.ts                    # scheduleAppointmentAction, cancelAppointmentAction
│
├── drizzle.config.ts                          # Drizzle Kit configuration
├── .env.local                                 # Environment variables (DATABASE_URL, Clerk keys)
└── package.json
```


## 4. How It Works (Component Layering Strategy)

- Server Component Pages: app/(dashboard)/*/page.tsx files run exclusively on the server, fetching data from Neon directly in under 20ms.
- Client Interactive Leaves: Interactive form dialogs and search inputs import from src/components/* and use 'use client' only where browser events are required.

## 5. Why It Has Been Done (Architectural Justification)

- 🚀 Blazing Fast Page Loads: By keeping data fetching in Server Components, users download 70% less JavaScript.
- 🧹 Strict Maintainability: Developers know exactly where every feature lives (UI in components, logic in lib, mutations in actions).

---


---


## ⚡ 6. Component Latency Profiles, Bottleneck Hazards & Mitigation SLAs

> ⚡ **Note:** Automotive workshop environments are hostile to latency: technicians use greasy mobile touchscreens over noisy 3G/LTE or fluctuating shop Wi-Fi. Every component must be hardened against latency traps, cold starts, and UI thrashing.


### 📊 Master Component Latency SLA & Optimization Matrix

| Component & Target File | Primary Latency Threat / Bottleneck | Unoptimized | Target SLA | Architectural Mitigation |
| --- | --- | --- | --- | --- |
| VehicleDamageCanvas.tsx (2D SVG Damage Mapper) | Continuous pointermove events causing React re-renders & SVG re-projection | 80ms - 140ms/event (laggy) | < 16ms (60 FPS) | Unmanaged pointerRef + requestAnimationFrame; state commits only on pointerUp; normalized (X%, Y%) math. |
| DVIPhotoUploader.tsx (Mobile Camera & Evidence) | Uploading 30-50 high-res camera photos (8-18MB each) over 3G/LTE | 45s - 120s total batch | < 250ms preview / < 1.5s chunk | Client-side Canvas WebP compression (10MB -> 260KB in <90ms); instant local blob preview URL; 3-worker pool. |
| OBDScannerModal.tsx / LivePIDStream.tsx | BLE GATT roundtrip latency (40-90ms/PID); 8 sequential PIDs = 600ms stutter loop | 500ms - 800ms loop | < 16.6ms gauge / < 150ms BLE | Decoupled BLE GATT notifications; linear interpolation (lerp) for 60 FPS gauges; 250ms watchdog timer. |
| JobCardStatusBar.tsx & JobCardItem.tsx | Network roundtrip when dragging cards between 4 pills (Created -> WIP -> Completed -> Due) | 250ms - 500ms lag | 0ms perceived / < 250ms commit | React 19 useOptimistic updates DOM instantly; non-blocking Server Action in startTransition; toast rollback on error. |
| PlateSearchInput.tsx (Plate-First Intake) | Unconstrained keystroke queries creating race conditions & DB pool exhaustion | 200ms - 400ms/key | < 80ms query / 0ms typing lag | 250ms useDebouncedCallback; React 19 useDeferredValue; PostgreSQL (workshop_id, license_plate) B-tree; LRU cache. |
| LineItemCalculator.tsx (Margin/Markup Math) | Synchronous re-calc of tax-exemption, parts markups & labor rates across 40 items | 40ms - 90ms input lag | < 2ms keystroke math | Pure memoization via useMemo; zero network roundtrips during drafting; server verifies totals upon final save. |
| db/index.ts & Server Actions (Neon Postgres) | Compute cold starts (350-800ms) after 5min idle; sequential queries causing N+1 waterfall | 600ms - 1200ms waterfall | < 35ms warm / < 450ms cold | Neon serverless HTTP pooler; login screen pre-warm ping; Drizzle relational joins collapsing 5 roundtrips into 1. |
| app/portal/[token]/page.tsx (Customer Portal) | Motorist opening WhatsApp link on mobile 4G; heavy JS hydration & raw photos | 3.5s - 6.0s LCP | < 800ms FCP / < 1.5s LCP | Zero client JS: Pure React Server Component streaming; next/image AVIF/WebP + blur; dynamic signature pad. |
| InvoiceView.tsx (Instant A4 Invoice & PDF) | Headless Chrome (Puppeteer) PDF generation causing 3s execution & memory spike | 2500ms - 5000ms server wait | < 50ms modal / 0ms server | Pure CSS @media print embedded in client; native window.print() generates crisp A4 PDFs with zero backend CPU. |
| InventoryTypeahead.tsx (Parts Virtualization) | Loading 10,000+ SKU inventory to client memory causing heap bloat & DOM freeze | 1200ms load + DOM lock | < 60ms search / < 16ms scroll | Server search with pg_trgm GIN index; hard LIMIT 15 pagination; DOM virtualization via @tanstack/react-virtual. |


### 🛠️ Deep-Dive: Latency Hardening Patterns

- 1. React 19 useOptimistic Pattern: Applied to all job card status toggles, WIP sliders, and checklist items. Technicians receive immediate 0ms haptic/visual confirmation while mutations persist asynchronously.
- 2. Edge Image Transcoding: Mobile camera photos are compressed on an OffscreenCanvas in Web Workers before hitting the network, saving over 90% of cellular bandwidth.
- 3. Hardware Smoothing Pipeline: OBD-II live telemetry decouples the 100ms hardware query frequency from the 60fps display refresh, preventing jittery needle animations.
- 4. Relational Single-Trip Drizzle Queries: All multi-entity views (e.g. Repair Order + Customer + Vehicle + Items) are compiled into single SQL statements to eliminate serverless HTTP waterfall penalties.

---

> 🧭 **Note:** ⬅️ Previous: [01 - System Overview & Architecture](https://notion.so/3e0968d84bdf813c97c1e0cda80014bb)   |   🏠 [Main Architecture Hub](https://notion.so/3df968d84bdf80c1aae3e239eb52e38d)   |   ➡️ Next: [03 - Next.js 16 Server Actions](https://notion.so/3e0968d84bdf81ce9635c1b6f60f360d)

