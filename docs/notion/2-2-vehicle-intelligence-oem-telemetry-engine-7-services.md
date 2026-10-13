# 2.2 - Vehicle Intelligence & OEM Telemetry Engine (7 Services)

> 🧭 **Note:** ⬅️ Previous: [09 - Digital Vehicle Inspection (DVI) & Body Damage Mapping](https://notion.so/3e0968d84bdf819b9e58e587b7ee7f76)   |   🏠 [Main Architecture Hub](https://notion.so/3df968d84bdf80c1aae3e239eb52e38d)   |   ➡️ Next: [11 - 3 C's Diagnostics & Hardware OBD-II Scanner](https://notion.so/3e0968d84bdf81df8968dcb3a9e6f46d)


# 10 - Vehicle Intelligence & OEM Telemetry Engine

> 🧠 **Note:** Benchmark: Matches ARI's 7-service OEM Vehicle Intelligence suite (Repair Reports, Maintenance Schedules, TSBs, Recalls, Warranty).


---


## 1. Working Notes & Functional Overview

Vehicle Intelligence elevates MechanicMate from a generic management tool into a professional diagnostic partner. By integrating OEM telemetry and predictive maintenance curves based on VIN and mileage, independent workshops can match the engineering intelligence of OEM dealerships.

- 7 Modular Intelligence Services accessible on any vehicle profile.
- Probabilistic Diagnostic Intelligence: Evaluates DTCs and provides statistically verified fixes ranked up to 99% probability.
- Predictive Maintenance: 12-month forward-looking wear forecasting to schedule customer return visits.
- 1-Click 'Add to Job Card' on every OEM maintenance item and TSB recommendation.

## 2. The 7 Vehicle Intelligence Services

| Service | Input Parameters | Output Data | Workshop Value |
| --- | --- | --- | --- |
| 1. Repair Report | DTC code + VIN | Root causes ranked by probability, required parts, estimated labor | Instant diagnostic guidance with 99% accuracy benchmarks |
| 2. Maintenance Schedule | VIN + Mileage (±10k mi / 15k km) | Factory service checklist due for current mileage | Prevents missing mandatory manufacturer service points |
| 3. Full Maintenance | VIN | Complete vehicle lifecycle maintenance roadmap (0 - 300,000+ km) | Long-term fleet maintenance planning and quote generation |
| 4. Upcoming Maintenance | VIN + Mileage + Annual Driving Avg | Predictive failure risks for the next 12 months | Customer retention marketing and proactive follow-up SMS |
| 5. TSB Bulletins | VIN / Year, Make, Model | Official OEM Technical Service Bulletins categorized by system | Resolves tricky intermittent factory known faults in minutes |
| 6. Safety Recalls | VIN / NHTSA database | Government & OEM safety recalls, campaign numbers, repair status | Legal compliance and passenger safety verification |
| 7. Warranty Status | VIN + In-Service Date + Mileage | Bumper-to-bumper, powertrain, corrosion, emissions coverage | Prevents charging customers for repairs covered by OEM warranty |


## 3. Where it is Configured

| Layer | File Path | Responsibility |
| --- | --- | --- |
| Route | app/(dashboard)/vehicles/[id]/intelligence/page.tsx | 7-card interactive grid matching ARI interface |
| UI Component | src/components/vehicles/VehicleIntelligenceGrid.tsx | Card grid with async state loaders and 'Get' buttons |
| UI Component | src/components/vehicles/IntelligenceModal.tsx | Detailed view of TSBs, Recalls, and Maintenance items |
| Server Action | src/actions/intelligence.ts | fetchVehicleIntelligenceAction, importOemItemToJobAction |
| Database Schema | src/lib/db/schema/diagnostics.ts | vehicle_intelligence_reports cache table in Neon DB |


## 4. How it Works: Server Action Implementation

```typescript
// src/actions/intelligence.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { vehicleIntelligenceReports, repairOrderItems } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function fetchVehicleIntelligenceAction(vehicleId: string, serviceType: string) {
  const { orgId } = await auth();
  if (!orgId) throw new Error("Unauthorized");

  // Check cached report in Neon Postgres
  const cached = await db.select().from(vehicleIntelligenceReports)
    .where(and(
      eq(vehicleIntelligenceReports.vehicleId, vehicleId),
      eq(vehicleIntelligenceReports.serviceType, serviceType)
    ));

  if (cached.length > 0 && (Date.now() - cached[0].cachedAt.getTime() < 1000 * 60 * 60 * 24 * 7)) {
    return { data: cached[0].reportData, fromCache: true };
  }

  // Fetch live OEM data and upsert into cache
  const reportData = await queryOemProvider(vehicleId, serviceType);
  await db.insert(vehicleIntelligenceReports).values({
    vehicleId,
    serviceType,
    reportData,
    cachedAt: new Date()
  }).onConflictDoUpdate({
    target: [vehicleIntelligenceReports.vehicleId, vehicleIntelligenceReports.serviceType],
    set: { reportData, cachedAt: new Date() }
  });

  return { data: reportData, fromCache: false };
}
```


## 5. Why it was Built This Way

- Professional Credibility: Showing customers official OEM maintenance schedules and TSBs builds unmatched trust.
- Predictive Revenue: The 12-month upcoming maintenance view allows automated service reminders, turning one-off customers into lifetime clients.
- Speed & Accuracy: Direct insertion of OEM recommended labor times and parts into job cards eliminates manual estimation errors.

---

> 🧭 **Note:** ⬅️ Previous: [09 - Digital Vehicle Inspection (DVI) & Body Damage Mapping](https://notion.so/3e0968d84bdf819b9e58e587b7ee7f76)   |   🏠 [Main Architecture Hub](https://notion.so/3df968d84bdf80c1aae3e239eb52e38d)   |   ➡️ Next: [11 - 3 C's Diagnostics & Hardware OBD-II Scanner](https://notion.so/3e0968d84bdf81df8968dcb3a9e6f46d)

