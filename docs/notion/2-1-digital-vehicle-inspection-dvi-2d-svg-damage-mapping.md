# 2.1 - Digital Vehicle Inspection (DVI) & 2D SVG Damage Mapping

> 🧭 **Note:** ⬅️ Previous: [08 - Google OAuth & Social Login (Clerk Configuration)](https://notion.so/3e0968d84bdf8123996ee38960ae9420)   |   🏠 [Main Architecture Hub](https://notion.so/3df968d84bdf80c1aae3e239eb52e38d)   |   ➡️ Next: [10 - Vehicle Intelligence & OEM Telemetry Engine](https://notion.so/3e0968d84bdf813d9100e0c0ca0835fd)


# 09 - Digital Vehicle Inspection (DVI) & Body Damage Mapping

> 🔍 **Note:** Benchmark: Inspired by ARI's comprehensive vehicle inspection, interactive damage markup, and instant job card conversion.


---


## 1. Working Notes & Functional Overview

Digital Vehicle Inspection (DVI) transforms the traditional paper-based walkaround into a high-trust digital workflow that protects the workshop against false damage claims and increases repair order approval rates by up to 78% through photo evidence.

- Inspection Numbers: Sequential auto-generated IDs (e.g. INSP-001) linked to Client and Vehicle (by license plate).
- Dual Assessment Cards: Dedicated entry points for 32-point checklist and interactive damage diagram.
- Rich Media Pipeline: Direct camera triggering (capture='environment') for up to 50 photos (10/batch) + 5 PDF attachments.
- 1-Click Job Card Generation: Converts failed/poor items directly into billable labor and parts on active repair orders.

## 2. Architectural Requirements & Dependencies

- Framework: Next.js 16 App Router (RSC + Client Components for interactive canvas).
- Database: Neon Serverless PostgreSQL with Drizzle ORM (tables: inspections, inspection_checklist_items, vehicle_damage_pins, inspection_attachments).
- Client Imaging: HTML5 Canvas for client-side image compression (max 1920x1080 WebP @ 80% quality) to prevent payload bloat.
- Coordinate Math: Normalized relative coordinates (0-100%) for responsive SVG damage pins.

## 3. What is Configured

The module is divided into three key sub-systems:

1. Checklist Matrix: 32 items across 6 core systems (Engine, Brakes, Tires, Steering, Electrical, Underbody) with 3-state rating (Good/Fair/Poor) plus quantitative measurements.
1. SVG Damage Mapper: Top-down and 4-quarter car diagram with draggable/clickable pins categorizing Dents, Scratches, Cracks, Paint Chips, Hail, Rust, and Missing Parts.
1. Media & Document Vault: Storage of photos and PDF reports (e.g. 4-wheel alignment printouts, diagnostic logs).

## 4. Where it is Configured

| Resource | File Location | Purpose |
| --- | --- | --- |
| Route - List | app/(dashboard)/inspections/page.tsx | Filterable inspection list (status, vehicle, date) |
| Route - New | app/(dashboard)/inspections/new/page.tsx | Full intake screen with checklist, damage, camera |
| Route - Details | app/(dashboard)/inspections/[id]/page.tsx | Detailed inspection report with approval actions |
| Component - Form | src/components/inspections/InspectionIntakeForm.tsx | Master intake form mirroring ARI design |
| Component - Diagram | src/components/inspections/BodyDamageCanvas.tsx | SVG car outline with normalized pin placement |
| Server Actions | src/actions/inspections.ts | createInspectionAction, convertInspectionToWorkOrderAction |
| Database Schema | src/lib/db/schema/inspections.ts | Drizzle schema for inspections, items, pins, attachments |


## 5. How it Works: Core Implementation

Normalized Pin-Drop Math in React 19 Client Component:

```typescript
// Calculate normalized (x, y) coordinates relative to SVG viewBox
function handleCanvasClick(e: React.MouseEvent<SVGSVGElement>) {
  const rect = e.currentTarget.getBoundingClientRect();
  const xPercent = Number((((e.clientX - rect.left) / rect.width) * 100).toFixed(2));
  const yPercent = Number((((e.clientY - rect.top) / rect.height) * 100).toFixed(2));

  // Add new pin state
  addDamagePinAction({
    inspectionId,
    vehicleId,
    viewAngle: currentView, // 'top' | 'side_driver' | 'front' etc.
    xPercent,
    yPercent,
    damageType: selectedType, // 'dent' | 'scratch' | 'crack'
    severity: "minor",
  });
}
```

Automated Work Order Conversion Server Action:

```typescript
export async function convertInspectionToWorkOrderAction(
  inspectionId: string,
  selectedItemIds: string[]
) {
  const { orgId } = await auth();
  if (!orgId) throw new Error("Unauthorized");

  const [insp] = await db.select().from(inspections).where(eq(inspections.id, inspectionId));
  const [cust] = await db.select().from(customers).where(eq(customers.id, insp.customerId));
  const laborRate = cust?.hasLaborRateOverride ? Number(cust.customLaborRateHourly) : 480.00;

  const [newRo] = await db.insert(repairOrders).values({
    workshopId: orgId,
    customerId: insp.customerId,
    vehicleId: insp.vehicleId,
    roNumber: `RO-${Date.now().toString().slice(-6)}`,
    status: "created",
    customerConcern: `Generated from Inspection ${insp.inspectionNumber}`,
    publicToken: crypto.randomUUID(),
  }).returning();

  for (const itemId of selectedItemIds) {
    const [item] = await db.select().from(inspectionChecklistItems).where(eq(inspectionChecklistItems.id, itemId));
    await db.insert(repairOrderItems).values({
      repairOrderId: newRo.id,
      itemType: "labour",
      description: item.suggestedAction || `Fix ${item.title}`,
      quantity: "1.00",
      unitPrice: laborRate.toFixed(2),
      totalPrice: laborRate.toFixed(2),
    });
  }

  await db.update(inspections).set({ status: "converted", repairOrderId: newRo.id }).where(eq(inspections.id, inspectionId));
  revalidatePath("/jobs");
  return { success: true, repairOrderId: newRo.id };
}
```


## 6. Why it was Built This Way

- Zero Disputes: Having photographic proof and timestamped damage marks eliminates customer accusations of pre-existing vehicle damage.
- High-Value Upsells: Visual inspection reports sent via WhatsApp allow vehicle owners to immediately understand why their brakes or suspension need servicing, leading to higher approval rates.
- Frictionless Flow: By converting inspection deficiencies directly into job card items, mechanics save 15-20 minutes of double-entry per vehicle.

---

> 🧭 **Note:** ⬅️ Previous: [08 - Google OAuth & Social Login (Clerk Configuration)](https://notion.so/3e0968d84bdf8123996ee38960ae9420)   |   🏠 [Main Architecture Hub](https://notion.so/3df968d84bdf80c1aae3e239eb52e38d)   |   ➡️ Next: [10 - Vehicle Intelligence & OEM Telemetry Engine](https://notion.so/3e0968d84bdf813d9100e0c0ca0835fd)

