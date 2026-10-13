# 2.5 - Work Completion, Digital Signatures & A4 VAT Invoicing

> 🧭 **Note:** ⬅️ Previous: [05 - API Endpoints, Webhooks & Integrations](https://notion.so/3e0968d84bdf81a9ac4bff84adba536d)   |   🏠 [Main Architecture Hub](https://notion.so/3df968d84bdf80c1aae3e239eb52e38d)   |   ➡️ Next: [07 - Mock Data to Live Database Migration Guide](https://notion.so/3e0968d84bdf819eb43cf28cc9de9a3f)


# 📄 Module 06: Work Completion & Invoice Reports

> 📋 **Note:** Working notes, architectural requirements, and formatting blueprint for dynamic, printable, and shareable work completion and tax invoice reports.


## 1. Architectural Requirements & Overview

- Dynamic React Server Component view at app/(dashboard)/jobs/[id]/report/page.tsx.
- Standard A4 / PDF print stylesheet using CSS @media print.
- One-tap WhatsApp web share link generation (https://wa.me/...).

## 2. What Needs to Be Done

Provide a clean, authoritative report that combines workshop branding, vehicle details, mechanic diagnostics, replaced parts, labour hours, and VAT totals in a format that can be printed physically or shared to a customer's smartphone.


## 3. Where Configurations Are Made & What Is Being Configured

| Feature | File Path | What Is Being Configured | Role / Purpose |
| --- | --- | --- | --- |
| Report Page View | app/(dashboard)/jobs/[id]/report/page.tsx | Dynamic RSC data fetch & layout | Renders workshop letterhead & itemized repair invoice |
| Print Optimization | src/index.css | @media print CSS rules | Hides navbars & formats white A4 page for laser printers |
| WhatsApp Share | src/components/invoices/ShareButtons.tsx | Encoded URL message generator | Enables one-tap WhatsApp summary dispatch |


## 4. How It Is Configured & How It Works (Step-by-Step)


### A. Dynamic Report Component (app/(dashboard)/jobs/[id]/report/page.tsx)

```typescript
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { repairOrders, customers, vehicles, repairOrderItems, workshops } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";

export default async function JobReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { orgId } = await auth();

  const [job] = await db
    .select({
      ro: repairOrders,
      customer: customers,
      vehicle: vehicles,
      workshop: workshops,
    })
    .from(repairOrders)
    .leftJoin(customers, eq(repairOrders.customerId, customers.id))
    .leftJoin(vehicles, eq(repairOrders.vehicleId, vehicles.id))
    .leftJoin(workshops, eq(repairOrders.workshopId, workshops.id))
    .where(and(eq(repairOrders.id, id), eq(repairOrders.workshopId, orgId!)));

  if (!job) notFound();

  const items = await db
    .select()
    .from(repairOrderItems)
    .where(eq(repairOrderItems.repairOrderId, id));

  return (
    <div className="report-container max-w-4xl mx-auto p-8 bg-white text-gray-900 rounded-lg shadow-lg">
      {/* 1. Workshop Letterhead */}
      <div className="border-b pb-4 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{job.workshop?.name || "Auto Workshop"}</h1>
          <p className="text-sm text-gray-600">{job.workshop?.address}</p>
          <p className="text-sm text-gray-600">VAT Reg: {job.workshop?.vatNumber || "N/A"}</p>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold text-emerald-600">WORK COMPLETION REPORT</span>
          <p className="text-sm text-gray-600">RO #: {job.ro.roNumber}</p>
          <p className="text-sm text-gray-600">Date: {new Date(job.ro.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      {/* 2. Customer & Vehicle Summary */}
      <div className="grid grid-cols-2 gap-4 py-4 border-b">
        <div>
          <h2 className="font-semibold text-gray-700">Client Details:</h2>
          <p>{job.customer?.firstName} {job.customer?.lastName}</p>
          <p className="text-sm text-gray-600">{job.customer?.phone}</p>
        </div>
        <div>
          <h2 className="font-semibold text-gray-700">Vehicle Details:</h2>
          <p className="font-bold text-gray-900">{job.vehicle?.licensePlate}</p>
          <p className="text-sm text-gray-600">{job.vehicle?.year} {job.vehicle?.make} {job.vehicle?.model} ({job.vehicle?.mileageKm} km)</p>
        </div>
      </div>

      {/* 3. Itemized Parts & Labour */}
      <table className="w-full my-6 text-left border-collapse">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="py-2">Item Description</th>
            <th className="py-2">Qty / Hrs</th>
            <th className="py-2">Unit Price</th>
            <th className="py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id} className="border-b">
              <td className="py-2">{it.description}</td>
              <td className="py-2">{it.quantity}</td>
              <td className="py-2">R {it.unitPrice}</td>
              <td className="py-2 text-right">R {it.totalPrice}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 4. Financial Totals */}
      <div className="flex justify-end pt-4">
        <div className="w-64 space-y-2">
          <div className="flex justify-between"><span>Subtotal Parts:</span><span>R {job.ro.subtotalParts}</span></div>
          <div className="flex justify-between"><span>Subtotal Labour:</span><span>R {job.ro.subtotalLabour}</span></div>
          <div className="flex justify-between"><span>VAT (15%):</span><span>R {job.ro.taxAmount}</span></div>
          <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Total Balance:</span><span>R {job.ro.totalAmount}</span></div>
        </div>
      </div>
    </div>
  );
}
```


### B. Print CSS Configuration (@media print)

```css
@media print {
  /* Hide interactive application navigation and action buttons */
  nav, aside, header, .no-print {
    display: none !important;
  }

  /* Force clean white background with high-contrast black typography */
  body, .report-container {
    background-color: #ffffff !important;
    color: #000000 !important;
    padding: 0 !important;
    margin: 0 !important;
    box-shadow: none !important;
  }

  /* Keep table rows and totals from breaking across pages */
  table, tr, .avoid-break {
    page-break-inside: avoid;
  }
}
```


## 5. Why It Has Been Done (Architectural Justification)

- 📱 Zero App Downloads for Customers: Customers do not need an account or dedicated app; they receive direct, transparent reports.
- 🖨️ Thermal & Laser Printer Friendly: Pure CSS @media print ensures clear physical printouts without wasting ink on dark UI backgrounds.

---

> 🧭 **Note:** ⬅️ Previous: [05 - API Endpoints, Webhooks & Integrations](https://notion.so/3e0968d84bdf81a9ac4bff84adba536d)   |   🏠 [Main Architecture Hub](https://notion.so/3df968d84bdf80c1aae3e239eb52e38d)   |   ➡️ Next: [07 - Mock Data to Live Database Migration Guide](https://notion.so/3e0968d84bdf819eb43cf28cc9de9a3f)

