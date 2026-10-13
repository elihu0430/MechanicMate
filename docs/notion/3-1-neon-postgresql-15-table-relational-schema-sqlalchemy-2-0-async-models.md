# 3.1 - Neon PostgreSQL 15-Table Relational Schema & SQLAlchemy 2.0 Async Models

> 🧭 **Note:** ⬅️ Previous: [03 - Next.js 15 Server Actions (Mutations & Forms)](https://notion.so/3e0968d84bdf81ce9635c1b6f60f360d)   |   🏠 [Main Architecture Hub](https://notion.so/3df968d84bdf80c1aae3e239eb52e38d)   |   ➡️ Next: [05 - API Endpoints, Webhooks & Integrations](https://notion.so/3e0968d84bdf81a9ac4bff84adba536d)


# 🐘 Module 04: Neon Database Setup & Drizzle ORM Configuration

> 📋 **Note:** Working notes, architectural requirements, and complete database setup guide for Neon Serverless PostgreSQL and Drizzle ORM.


## 1. Architectural Requirements & Overview

- PostgreSQL 16 Serverless database hosted on Neon (console.neon.tech).
- HTTP connection pooler driver (@neondatabase/serverless).
- Drizzle ORM (drizzle-orm) + Drizzle Kit (drizzle-kit) CLI.
- 8 relational tables with multi-tenant workshop_id foreign keys and B-tree indexes.

## 2. What Needs to Be Done

Provision a serverless PostgreSQL cluster on Neon, configure connection pooling over HTTP/2, define type-safe Drizzle schema tables, and deploy database migrations.


## 3. Where Configurations Are Made & What Is Being Configured

| Configuration Item | File / Console Location | What Is Being Configured | Role / Purpose |
| --- | --- | --- | --- |
| Neon Cloud Project | console.neon.tech | Project 'mechanicmate', compute autoscaling | Managed serverless PostgreSQL instance |
| Connection String | .env.local | DATABASE_URL=postgresql://...-pooler... | Secure pooled database credentials |
| Drizzle Kit Tooling | drizzle.config.ts | Dialect, schema path, migration output | Configures drizzle-kit CLI for pushes & migrations |
| Database Client | src/lib/db/index.ts | neon() HTTP driver + drizzle() client | Provides global type-safe db client |
| Relational Schema | src/lib/db/schema/index.ts | 8 production tables & indexes | Defines relational entities and B-tree indexes |


## 4. How It Is Configured & How It Works (Step-by-Step)


### A. Tooling Installation

```bash
pnpm add drizzle-orm @neondatabase/serverless
pnpm add -D drizzle-kit tsx dotenv @types/node
```


### B. Drizzle Configuration File (drizzle.config.ts)

```typescript
import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/lib/db/schema/index.ts",
  out: "./src/lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
```


### C. Database Client Instance (src/lib/db/index.ts)

```typescript
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing from environment variables");
}

// neon() creates an HTTP query client with zero TCP pool exhaustion
const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });
```


### D. Complete 8-Table Schema (src/lib/db/schema/index.ts)

```typescript
import { pgTable, uuid, varchar, integer, numeric, text, timestamp, date, index } from "drizzle-orm/pg-core";

// 1. WORKSHOPS (Multi-Tenant Root)
export const workshops = pgTable("workshops", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  address: text("address"),
  vatNumber: varchar("vat_number", { length: 100 }),
  labourRateHourly: numeric("labour_rate_hourly", { precision: 10, scale: 2 }).notNull().default("480.00"),
  taxRatePercent: numeric("tax_rate_percent", { precision: 5, scale: 2 }).notNull().default("15.00"),
  currency: varchar("currency", { length: 10 }).notNull().default("ZAR"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 2. USERS (Mechanics & Staff linked to Clerk)
export const users = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(), // Clerk User ID
  workshopId: uuid("workshop_id").notNull().references(() => workshops.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("mechanic"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 3. CUSTOMERS
export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  workshopId: uuid("workshop_id").notNull().references(() => workshops.id, { onDelete: "cascade" }),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  email: varchar("email", { length: 255 }),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 4. VEHICLES (With Fast License Plate Index)
export const vehicles = pgTable("vehicles", {
  id: uuid("id").defaultRandom().primaryKey(),
  workshopId: uuid("workshop_id").notNull().references(() => workshops.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  licensePlate: varchar("license_plate", { length: 50 }).notNull(),
  year: integer("year").notNull(),
  make: varchar("make", { length: 100 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  color: varchar("color", { length: 50 }),
  mileageKm: integer("mileage_km").notNull().default(0),
  engine: varchar("engine", { length: 100 }),
  vin: varchar("vin", { length: 17 }),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  plateIdx: index("idx_vehicles_plate").on(table.workshopId, table.licensePlate),
}));

// 5. REPAIR ORDERS (Jobs)
export const repairOrders = pgTable("repair_orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  workshopId: uuid("workshop_id").notNull().references(() => workshops.id, { onDelete: "cascade" }),
  customerId: uuid("customer_id").notNull().references(() => customers.id),
  vehicleId: uuid("vehicle_id").notNull().references(() => vehicles.id),
  roNumber: varchar("ro_number", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("scheduled"),
  customerConcern: text("customer_concern").notNull(),
  diagnosis: text("diagnosis"),
  recommendedWork: text("recommended_work"),
  subtotalParts: numeric("subtotal_parts", { precision: 10, scale: 2 }).notNull().default("0.00"),
  subtotalLabour: numeric("subtotal_labour", { precision: 10, scale: 2 }).notNull().default("0.00"),
  taxAmount: numeric("tax_amount", { precision: 10, scale: 2 }).notNull().default("0.00"),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull().default("0.00"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  statusIdx: index("idx_repair_orders_status").on(table.workshopId, table.status),
}));

// 6. REPAIR ORDER ITEMS (Line Items: Parts & Labour)
export const repairOrderItems = pgTable("repair_order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  repairOrderId: uuid("repair_order_id").notNull().references(() => repairOrders.id, { onDelete: "cascade" }),
  itemType: varchar("item_type", { length: 20 }).notNull(), // 'part' | 'labour'
  description: varchar("description", { length: 255 }).notNull(),
  partNumber: varchar("part_number", { length: 100 }),
  quantity: numeric("quantity", { precision: 8, scale: 2 }).notNull().default("1.00"),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull().default("0.00"),
  labourHours: numeric("labour_hours", { precision: 6, scale: 2 }),
  labourHourlyRate: numeric("labour_hourly_rate", { precision: 10, scale: 2 }),
  totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull().default("0.00"),
});

// 7. INVOICES
export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  workshopId: uuid("workshop_id").notNull().references(() => workshops.id, { onDelete: "cascade" }),
  repairOrderId: uuid("repair_order_id").notNull().references(() => repairOrders.id),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("draft"),
  dueDate: date("due_date").notNull(),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  paidAmount: numeric("paid_amount", { precision: 10, scale: 2 }).notNull().default("0.00"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 8. PAYMENTS
export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(),
  transactionReference: varchar("transaction_reference", { length: 255 }),
  recordedByUserId: varchar("recorded_by_user_id", { length: 255 }).references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
```


### E. Pushing Schema Live to Neon

```bash
pnpm drizzle-kit push
```


## 5. Why It Has Been Done (Architectural Justification)

- 🌐 Eliminates Serverless TCP Exhaustion: Neon HTTP connection pooler allows hundreds of simultaneous Server Actions without hitting database connection caps.
- 💰 Cost Efficiency: Neon automatically suspends compute when the workshop closes, dropping database hosting costs to near zero.
- ⚡ Instant Schema Sync: drizzle-kit push updates the database structure in milliseconds without manual SQL migration files during development.

---

> 🧭 **Note:** ⬅️ Previous: [03 - Next.js 15 Server Actions (Mutations & Forms)](https://notion.so/3e0968d84bdf81ce9635c1b6f60f360d)   |   🏠 [Main Architecture Hub](https://notion.so/3df968d84bdf80c1aae3e239eb52e38d)   |   ➡️ Next: [05 - API Endpoints, Webhooks & Integrations](https://notion.so/3e0968d84bdf81a9ac4bff84adba536d)

