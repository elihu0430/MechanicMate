# 4.2 - Mock Data to Live Database Migration Audit

> 🧭 **Note:** ⬅️ Previous: [06 - Work Completion & Invoice Reports](https://notion.so/3e0968d84bdf812dbda2d5a786b8ca91)   |   🏠 [Main Architecture Hub](https://notion.so/3df968d84bdf80c1aae3e239eb52e38d)   |   ➡️ Next: [08 - Google OAuth & Social Login (Clerk Configuration)](https://notion.so/3e0968d84bdf8123996ee38960ae9420)


# 🔄 Module 07: Mock Data to Live Database Migration Guide

> 📋 **Note:** Working notes, architectural requirements, and execution plan to eliminate static mock arrays in src/App.tsx and transition 100% of application state to Neon PostgreSQL.


## 1. Architectural Requirements & Overview

- Audit of all mock data variables in src/App.tsx (CUSTOMERS, VEHICLES, JOBS, APPOINTMENTS).
- Replacement of in-memory client state with React Server Components (RSC) and Drizzle queries.
- Binding of modal forms to Server Actions.

## 2. What Needs to Be Done

Eradicate hardcoded test constants from prototype files and connect all dashboard widgets to live database queries populated by real user form inputs.


## 3. Where Configurations Are Made & Migration Mapping

| Legacy Mock Array | Target Neon Table | Server Component File | User Input Action Source |
| --- | --- | --- | --- |
| const CUSTOMERS = [...] | customers | app/(dashboard)/customers/page.tsx | createCustomerAction in CustomerModal.tsx |
| const VEHICLES = [...] | vehicles | app/(dashboard)/vehicles/page.tsx | registerVehicleAction in AddVehicleModal.tsx |
| const JOBS = [...] | repair_orders & items | app/(dashboard)/jobs/page.tsx | createRepairOrderAction in JobWizard.tsx |
| const APPOINTMENTS = [...] | appointments | app/(dashboard)/appointments/page.tsx | scheduleAppointmentAction in BookingModal.tsx |


## 4. How It Is Configured & Step-by-Step Code Replacement


### Step 1: Delete Mock Constants from Codebase

Remove lines 56–84 from src/App.tsx:

```typescript
// ❌ DELETE STATIC TEST ARRAYS:
// const CUSTOMERS = [ { id: '1', name: 'John Doe', ... } ];
// const VEHICLES = [ { id: '1', plate: 'ABC 1234 GP', ... } ];
// const JOBS = [ { id: '1', ro: 'RO-1001', ... } ];
```


### Step 2: Replace with Live Server Component (app/(dashboard)/jobs/page.tsx)

```typescript
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { repairOrders, customers, vehicles } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { JobsTableClient } from "@/components/jobs/JobsTableClient";

export default async function JobsPage() {
  const { orgId } = await auth();

  // 🔴 PURE LIVE NEON DATABASE QUERY — ZERO MOCK DATA:
  const liveJobs = await db
    .select({
      id: repairOrders.id,
      ro: repairOrders.roNumber,
      status: repairOrders.status,
      service: repairOrders.recommendedWork,
      concern: repairOrders.customerConcern,
      total: repairOrders.totalAmount,
      date: repairOrders.createdAt,
      customerName: customers.firstName,
      vehicleMake: vehicles.make,
      vehicleModel: vehicles.model,
      plate: vehicles.licensePlate,
    })
    .from(repairOrders)
    .leftJoin(customers, eq(repairOrders.customerId, customers.id))
    .leftJoin(vehicles, eq(repairOrders.vehicleId, vehicles.id))
    .where(eq(repairOrders.workshopId, orgId!))
    .orderBy(desc(repairOrders.createdAt));

  return <JobsTableClient initialJobs={liveJobs} />;
}
```


## 5. Why It Has Been Done (Architectural Justification)

- 💾 Data Permanence: Moving from client memory to PostgreSQL ensures customer and vehicle repair histories persist across browser reloads and multiple technician devices.
- 👥 Multi-User Concurrency: Several mechanics in the same workshop can view and update repair orders in real time.

---

> 🧭 **Note:** ⬅️ Previous: [06 - Work Completion & Invoice Reports](https://notion.so/3e0968d84bdf812dbda2d5a786b8ca91)   |   🏠 [Main Architecture Hub](https://notion.so/3df968d84bdf80c1aae3e239eb52e38d)   |   ➡️ Next: [08 - Google OAuth & Social Login (Clerk Configuration)](https://notion.so/3e0968d84bdf8123996ee38960ae9420)

