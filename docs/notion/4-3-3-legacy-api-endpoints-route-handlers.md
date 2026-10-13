# 4.3.3 - Legacy API Endpoints & Route Handlers

> 🧭 **Note:** ⬅️ Previous: [04 - Neon Database Setup & Drizzle ORM](https://notion.so/3e0968d84bdf8121a408d506ddf4f650)   |   🏠 [Main Architecture Hub](https://notion.so/3df968d84bdf80c1aae3e239eb52e38d)   |   ➡️ Next: [06 - Work Completion & Invoice Reports](https://notion.so/3e0968d84bdf812dbda2d5a786b8ca91)


# 🌐 Module 05: API Endpoints, Webhooks & Integrations

> 📋 **Note:** Working notes, architectural requirements, and integration blueprint for Next.js 15 Route Handlers ('app/api/*'), Clerk authentication webhooks, and third-party dispatchers.


## 1. Architectural Requirements & Overview

- Next.js 15 Route Handlers (app/api/*/route.ts).
- Svix cryptographic verification library (pnpm add svix).
- Clerk Webhook endpoint with secret token verification.
- System Health Monitor with live Neon latency reporting.

## 2. What Needs to Be Done

Configure HTTP endpoints strictly for external callers, webhooks, and monitoring tools that operate over standard REST protocols rather than Server Actions.


## 3. Where Configurations Are Made & What Is Being Configured

| Endpoint Route | File Path | What Is Being Configured | Role / Purpose |
| --- | --- | --- | --- |
| Clerk Webhook | app/api/webhooks/clerk/route.ts | Svix signature validation + Neon user sync | Auto-provisions mechanic profiles when users sign up |
| Health Monitor | app/api/health/route.ts | SELECT 1 database query & latency timer | Uptime check for deployment monitors |
| WhatsApp Dispatcher | app/api/notifications/whatsapp/route.ts | Message formatting & redirect URL generator | Triggers customer alerts when vehicles are ready |


## 4. How It Is Configured & How It Works (Step-by-Step)


### A. Clerk Webhook Handler with Svix Verification (app/api/webhooks/clerk/route.ts)

```typescript
import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, workshops } from "@/lib/db/schema";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    return new Response("Missing CLERK_WEBHOOK_SECRET in .env.local", { status: 500 });
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing required Svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    return new Response("Invalid signature", { status: 400 });
  }

  // 1. Sync Organization (Workshop)
  if (evt.type === "organization.created") {
    const { id, name } = evt.data;
    await db.insert(workshops).values({ id, name }).onConflictDoNothing();
  }

  // 2. Sync User (Mechanic)
  if (evt.type === "user.created") {
    const { id, first_name, last_name, email_addresses } = evt.data;
    const email = email_addresses[0]?.email_address || "";
    const name = `${first_name || ""} ${last_name || ""}`.trim() || "Mechanic";

    await db.insert(users).values({
      id,
      workshopId: (evt.data as any).organization_id,
      name,
      email,
      role: "mechanic",
    }).onConflictDoUpdate({
      target: users.id,
      set: { name, email },
    });
  }

  return new Response("Webhook processed successfully", { status: 200 });
}
```


### B. Database Health Monitor (app/api/health/route.ts)

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const start = Date.now();
    await db.execute(sql`SELECT 1`);
    const duration = Date.now() - start;

    return NextResponse.json({
      status: "healthy",
      database: "connected (Neon Serverless Postgres)",
      latencyMs: duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      status: "unhealthy",
      error: error.message,
    }, { status: 500 });
  }
}
```


## 5. Why It Has Been Done (Architectural Justification)

- 🛡️ Cryptographic Integrity: Svix verification ensures malicious external actors cannot spoof fake user creation events.
- 🔄 Seamless Background Provisioning: When a mechanic registers, their workshop profile is created in Neon automatically before they even land on the dashboard.
- 📊 Production Observability: The /api/health endpoint enables continuous uptime monitoring by services like BetterStack or Pingdom.

---

> 🧭 **Note:** ⬅️ Previous: [04 - Neon Database Setup & Drizzle ORM](https://notion.so/3e0968d84bdf8121a408d506ddf4f650)   |   🏠 [Main Architecture Hub](https://notion.so/3df968d84bdf80c1aae3e239eb52e38d)   |   ➡️ Next: [06 - Work Completion & Invoice Reports](https://notion.so/3e0968d84bdf812dbda2d5a786b8ca91)

