"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { MOCK_CUSTOMERS, formatCurrency } from "@/lib/mock-data";

export default function CustomersPage() {
  const [search, setSearch] = useState("");

  const filteredCustomers = MOCK_CUSTOMERS.filter((c) => {
    const q = search.toLowerCase();
    return (
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q)
    );
  });

  return (
    <AppShell activeItem="customers">
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        {/* Title Bar & Add Customer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Customers Directory
            </h1>
            <p className="text-xs sm:text-sm font-medium text-[#7a7a7a] mt-0.5">
              Client profiles, vehicle fleets, contact records, and account
              balances.
            </p>
          </div>

          <Link
            href="/customers/new"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#22c55e] px-4 py-2.5 text-sm font-bold text-black shadow-md shadow-emerald-950/20 hover:bg-[#16a34a] active:scale-95 transition-all select-none self-start sm:self-auto"
          >
            <span className="text-base font-extrabold">+</span>
            <span>New Customer</span>
          </Link>
        </div>

        {/* Search */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#737373]">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by customer name, phone number, address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#141414] border border-[#262626] text-sm text-white placeholder:text-[#555] focus:border-[#22c55e] focus:outline-none"
          />
        </div>

        {/* Customer Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredCustomers.map((cust) => (
            <div
              key={cust.id}
              className="rounded-2xl bg-[#141414] border border-[#242424] p-5 flex flex-col justify-between space-y-4 hover:border-[#383838] transition-colors shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <Link
                      href={`/customers/${cust.id}`}
                      className="text-base font-bold text-white hover:text-[#22c55e] transition-colors"
                    >
                      {cust.name}
                    </Link>
                    <p className="text-xs text-[#8c8c8c] mt-0.5">
                      {cust.phone}
                    </p>
                    <p className="text-xs text-[#666] truncate mt-0.5">
                      {cust.email}
                    </p>
                  </div>

                  <span className="text-xs font-bold text-[#888] bg-[#1a1a1a] border border-[#262626] px-2.5 py-1 rounded-lg">
                    {cust.vehiclesCount}{" "}
                    {cust.vehiclesCount === 1 ? "Vehicle" : "Vehicles"}
                  </span>
                </div>

                <p className="text-xs text-[#737373] mt-2 line-clamp-1">
                  {cust.address}
                </p>
              </div>

              <div className="pt-3 border-t border-[#1f1f1f] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#666] tracking-wider block">
                    Outstanding Balance
                  </span>
                  <span
                    className={`font-mono text-sm font-bold ${
                      cust.outstandingBalance > 0
                        ? "text-[#ef4444]"
                        : "text-[#22c55e]"
                    }`}
                  >
                    {cust.outstandingBalance > 0
                      ? formatCurrency(cust.outstandingBalance)
                      : "Paid in Full"}
                  </span>
                </div>

                {/* Direct Action Shortcuts: WhatsApp & Call */}
                <div className="flex items-center gap-1.5">
                  <a
                    href={`https://wa.me/27${cust.phone.replace(/\D/g, "").slice(-9)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0f2416] border border-[#1d472c] text-[#22c55e] hover:bg-[#163620] transition-colors"
                    title="WhatsApp Message"
                  >
                    💬
                  </a>
                  <a
                    href={`tel:${cust.phone.replace(/\s+/g, "")}`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-white hover:bg-[#252525] transition-colors"
                    title="Call Customer"
                  >
                    📞
                  </a>
                  <Link
                    href={`/customers/${cust.id}`}
                    className="flex h-9 items-center justify-center px-3 rounded-lg bg-[#1f1f1f] text-xs font-bold text-neutral-200 hover:bg-[#282828] transition-colors"
                  >
                    View
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
