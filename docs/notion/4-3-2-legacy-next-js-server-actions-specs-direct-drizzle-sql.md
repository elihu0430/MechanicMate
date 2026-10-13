# 4.3.2 - Legacy Next.js Server Actions Specs (Direct Drizzle SQL)

> 🧭 **Note:** ⬅️ Previous: [02 - Next.js 15 File Routing & Components](https://notion.so/3e0968d84bdf81b6934dc43f5e44ea69)   |   🏠 [Main Architecture Hub](https://notion.so/3df968d84bdf80c1aae3e239eb52e38d)   |   ➡️ Next: [04 - Neon Database Setup & Drizzle ORM](https://notion.so/3e0968d84bdf8121a408d506ddf4f650)


# ⚡ Module 03: Next.js 15 Server Actions (Mutations & Forms)

> 📋 **Note:** Working notes, architectural requirements, and configuration blueprint for Next.js 15 Server Actions ('use server'). This module explains what is configured, where it is configured, how it works, and why this design was chosen.


## 1. Architectural Requirements & Overview

- Next.js 15 App Router with native React 19 Server Actions.
- Clerk Authentication with tenant session verification via auth().
- Zod schema validation library (pnpm add zod) for all action arguments.
- Drizzle ORM client (src/lib/db) for direct PostgreSQL mutations.
- Next.js cache revalidation via revalidatePath() for real-time UI synchronization.

## 2. What Needs to Be Done

Instead of creating dozens of traditional REST API routes (e.g. POST /api/vehicles, PUT /api/jobs), all internal application data mutations must be written as typed Server Actions. Each action validates user inputs, checks the tenant workshop ID, performs the database write against Neon, and automatically purges the Next.js page cache so the UI updates instantly.


## 3. Where Configurations Are Made & What Is Being Configured

| Configuration Area | Exact File Path | What Is Being Configured | Role / Purpose |
| --- | --- | --- | --- |
| Action Layer | src/actions/vehicles.ts | registerVehicleAction, lookupVehicleByPlateAction | Vehicle intake, plate search & mileage updates |
| Action Layer | src/actions/jobs.ts | createRepairOrderAction, updateJobStatusAction | Job creation, line items, and status transitions |
| Action Layer | src/actions/customers.ts | createCustomerAction, updateCustomerAction | Customer CRM registration and updates |
| Action Layer | src/actions/invoices.ts | createInvoiceAction, recordPaymentAction | Invoice generation & recording payments |
| Validation Layer | src/lib/validators/*.ts | Zod schemas for all forms | Input validation before reaching SQL database |
| Client UI Binding | src/components/* | Forms using useTransition & useOptimistic | Interactive form dispatch and instant UI updates |


## 4. How It Is Configured & How It Works (Step-by-Step)


### A. Defining a Typed Server Action (src/actions/vehicles.ts)

Every action starts with the 'use server' directive at the top of the file:

```typescript
"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { vehicles, customers } from "@/lib/db/schema";
import { eq, and, ilike } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// 1. Zod Validation Schema
const RegisterVehicleSchema = z.object({
  customerId: z.string().uuid("Invalid Customer ID"),
  licensePlate: z.string().min(2).max(20),
  make: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  year: z.number().int().min(1950).max(2035),
  mileageKm: z.number().int().nonnegative().default(0),
  color: z.string().optional(),
  engine: z.string().optional(),
});

// 2. Fast Plate Search Action
export async function lookupVehicleByPlateAction(plateQuery: string) {
  const { orgId } = await auth();
  if (!orgId) throw new Error("Unauthorized: Active workshop session required");

  const normalized = plateQuery.trim().toUpperCase();
  const records = await db
    .select({
      vehicle: vehicles,
      customer: customers,
    })
    .from(vehicles)
    .leftJoin(customers, eq(vehicles.customerId, customers.id))
    .where(and(eq(vehicles.workshopId, orgId), ilike(vehicles.licensePlate, `%${normalized}%`)))
    .limit(10);

  return records;
}

// 3. Register Vehicle Mutation Action
export async function registerVehicleAction(input: z.infer<typeof RegisterVehicleSchema>) {
  const { orgId } = await auth();
  if (!orgId) throw new Error("Unauthorized");

  const validated = RegisterVehicleSchema.parse(input);
  const [created] = await db.insert(vehicles).values({
    workshopId: orgId,
    ...validated,
    licensePlate: validated.licensePlate.trim().toUpperCase(),
    status: "active",
  }).returning();

  // Revalidate cache on all pages displaying vehicle lists
  revalidatePath("/vehicles");
  revalidatePath("/customers");
  return { success: true, data: created };
}
```


### B. Repair Order Actions & Status Transitions (src/actions/jobs.ts)

```typescript
"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { repairOrders, repairOrderItems } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CreateJobSchema = z.object({
  customerId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  service: z.string().min(3),
  customerConcern: z.string().min(5),
});

export async function createRepairOrderAction(input: z.infer<typeof CreateJobSchema>) {
  const { orgId } = await auth();
  if (!orgId) throw new Error("Unauthorized");

  const validated = CreateJobSchema.parse(input);
  const roCount = await db.$count(repairOrders, eq(repairOrders.workshopId, orgId));
  const roNumber = `RO-${1000 + roCount + 1}`;

  const [job] = await db.insert(repairOrders).values({
    workshopId: orgId,
    roNumber,
    customerId: validated.customerId,
    vehicleId: validated.vehicleId,
    customerConcern: validated.customerConcern,
    recommendedWork: validated.service,
    status: "in-progress",
  }).returning();

  revalidatePath("/jobs");
  revalidatePath("/");
  return { success: true, data: job };
}

export async function updateJobStatusAction(
  jobId: string, 
  status: "scheduled" | "in-progress" | "waiting-parts" | "ready" | "completed"
) {
  const { orgId } = await auth();
  if (!orgId) throw new Error("Unauthorized");

  await db.update(repairOrders)
    .set({ 
      status, 
      completedAt: status === "completed" ? new Date() : null 
    })
    .where(and(eq(repairOrders.id, jobId), eq(repairOrders.workshopId, orgId)));

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/jobs");
  revalidatePath("/");
  return { success: true };
}
```


### C. Connecting Actions to React UI with Optimistic Updates

```typescript
"use client";

import { useOptimistic, useTransition } from "react";
import { updateJobStatusAction } from "@/actions/jobs";

export function JobStatusButton({ jobId, initialStatus }) {
  const [isPending, startTransition] = useTransition();
  const [status, setOptimisticStatus] = useOptimistic(
    initialStatus,
    (_, nextStatus) => nextStatus
  );

  function handleStatusChange(next) {
    startTransition(async () => {
      setOptimisticStatus(next); // ⚡ Instant UI feedback before server completes
      await updateJobStatusAction(jobId, next);
    });
  }

  return (
    <button 
      onClick={() => handleStatusChange("completed")} 
      disabled={isPending}
      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded text-white font-medium transition"
    >
      {status === "completed" ? "Completed ✓" : "Mark Complete"}
    </button>
  );
}
```


## 5. Why It Has Been Done (Architectural Justification)

- ⚡ Zero REST API Boilerplate: You never need to write express-style routes, handle URL routing parameters, or serialize manual JSON responses.
- 🛡️ End-to-End Type Safety: TypeScript types flow straight from the Drizzle database schema to the frontend component props with full autocomplete and compiler verification.
- 🔒 Bulletproof Security: Execution happens strictly on the server inside Node.js; credentials and SQL queries are never shipped to client browser bundles.
- 🔄 Automatic Cache Invalidation: Calling revalidatePath('/jobs') automatically flushes Next.js Server Component caches so all connected devices see updated job statuses immediately.

---

> 🧭 **Note:** ⬅️ Previous: [02 - Next.js 15 File Routing & Components](https://notion.so/3e0968d84bdf81b6934dc43f5e44ea69)   |   🏠 [Main Architecture Hub](https://notion.so/3df968d84bdf80c1aae3e239eb52e38d)   |   ➡️ Next: [04 - Neon Database Setup & Drizzle ORM](https://notion.so/3e0968d84bdf8121a408d506ddf4f650)

