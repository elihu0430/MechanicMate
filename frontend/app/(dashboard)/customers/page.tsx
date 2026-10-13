"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useApi, ApiCustomer } from "@/lib/api";
import { formatCurrency } from "@/lib/format";

export default function CustomersPage() {
  const api = useApi();
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<ApiCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (query?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.customers.list(query);
      setCustomers(data);
    } catch (err: any) {
      console.error("Failed to load customers:", err);
      setError(err?.message || "Failed to load customers from backend");
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData(search);
  };

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
              Live client profiles, vehicle fleets, contact records, and account balances.
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
        <form onSubmit={handleSearchSubmit} className="relative">
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
            placeholder="Search by customer name, phone number, address... (press Enter)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#141414] border border-[#262626] text-sm text-white placeholder:text-[#555] focus:border-[#22c55e] focus:outline-none"
          />
        </form>

        {error && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => loadData(search)}
              className="text-xs font-bold underline hover:text-white"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="py-12 text-center text-[#737373] text-sm animate-pulse">
            Loading real customers from database...
          </div>
        )}

        {/* Empty state */}
        {!isLoading && customers.length === 0 && (
          <div className="py-16 text-center rounded-2xl border border-dashed border-[#262626] p-8 space-y-3">
            <p className="text-base font-bold text-neutral-300">No customers found</p>
            <p className="text-xs text-[#737373]">
              {search ? `No customer matched "${search}"` : "Get started by registering your first customer."}
            </p>
            <Link
              href="/customers/new"
              className="inline-block mt-2 rounded-xl bg-[#22c55e] px-4 py-2 text-xs font-bold text-black hover:bg-[#16a34a]"
            >
              Register Customer
            </Link>
          </div>
        )}

        {/* Customer Cards Grid */}
        {!isLoading && customers.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {customers.map((cust) => {
              const fullName = `${cust.first_name} ${cust.last_name}`.trim();
              return (
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
                          {fullName}
                        </Link>
                        <p className="text-xs text-[#8c8c8c] mt-0.5">
                          {cust.phone}
                        </p>
                        {cust.email && (
                          <p className="text-xs text-[#666] truncate mt-0.5">
                            {cust.email}
                          </p>
                        )}
                      </div>

                      {cust.is_tax_exempt && (
                        <span className="text-[10px] font-bold text-[#38bdf8] bg-[#38bdf8]/10 border border-[#38bdf8]/20 px-2 py-0.5 rounded-md">
                          Tax Exempt
                        </span>
                      )}
                    </div>

                    {cust.address && (
                      <p className="text-xs text-[#737373] mt-2 line-clamp-1">
                        {cust.address}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#1f1f1f] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#666] tracking-wider block">
                        Terms & Discount
                      </span>
                      <span className="font-mono text-xs text-[#a3a3a3]">
                        {cust.default_discount_percent > 0 ? `${cust.default_discount_percent}% off` : "Standard"}{" "}
                        {cust.custom_payment_terms_days > 0 ? `• Net ${cust.custom_payment_terms_days}d` : "• COD"}
                      </span>
                    </div>

                    {/* Direct Action Shortcuts: WhatsApp & Call */}
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`https://wa.me/${cust.phone.replace(/\D/g, "")}`}
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
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
