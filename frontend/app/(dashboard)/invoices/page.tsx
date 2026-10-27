"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { type ApiInvoice } from "@/lib/api/invoices";
import { useApi } from "@/lib/api/use-api";
import { formatCurrency, formatDate } from "@/lib/format";

const STATUS_FILTERS = [
  { id: "all", label: "All Invoices" },
  { id: "sent", label: "Awaiting Payment" },
  { id: "partially-paid", label: "Partially Paid" },
  { id: "paid", label: "Paid in Full" },
];

const STATUS_CONFIG: Record<
  string,
  { label: string; text: string; bg: string; dot: string; border: string }
> = {
  draft: {
    label: "Draft",
    text: "text-neutral-400",
    bg: "bg-neutral-800/40",
    dot: "bg-neutral-400",
    border: "border-neutral-700/40",
  },
  sent: {
    label: "Awaiting Payment",
    text: "text-[#f59e0b]",
    bg: "bg-[#f59e0b]/10",
    dot: "bg-[#f59e0b]",
    border: "border-[#f59e0b]/25",
  },
  "partially-paid": {
    label: "Partially Paid",
    text: "text-[#38bdf8]",
    bg: "bg-[#38bdf8]/10",
    dot: "bg-[#38bdf8]",
    border: "border-[#38bdf8]/25",
  },
  paid: {
    label: "Paid in Full",
    text: "text-[#22c55e]",
    bg: "bg-[#22c55e]/10",
    dot: "bg-[#22c55e]",
    border: "border-[#22c55e]/25",
  },
  overdue: {
    label: "Overdue",
    text: "text-[#ef4444]",
    bg: "bg-[#ef4444]/10",
    dot: "bg-[#ef4444]",
    border: "border-[#ef4444]/25",
  },
  cancelled: {
    label: "Cancelled",
    text: "text-[#ef4444]",
    bg: "bg-[#ef4444]/10",
    dot: "bg-[#ef4444]",
    border: "border-[#ef4444]/25",
  },
};

export default function InvoicesPage() {
  const api = useApi();
  const [filter, setFilter] = useState("all");
  const [invoices, setInvoices] = useState<ApiInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInvoices = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.invoices.list();
      setInvoices(data);
    } catch (err: any) {
      console.error("Failed to load invoices:", err);
      setError(err?.message || "Failed to load invoices from database");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredInvoices = invoices.filter(
    (inv) => filter === "all" || inv.status === filter
  );

  const totalBilled = invoices
    .filter((i) => i.status !== "cancelled")
    .reduce((s, i) => s + Number(i.total_amount || 0), 0);

  const totalCollected = invoices
    .filter((i) => i.status !== "cancelled")
    .reduce(
      (s, i) =>
        s +
        (i.status === "paid"
          ? Number(i.total_amount || 0)
          : Number(i.paid_amount || 0)),
      0
    );

  const totalOutstanding = invoices
    .filter((i) => i.status !== "paid" && i.status !== "cancelled")
    .reduce(
      (s, i) =>
        s + Math.max(0, Number(i.total_amount || 0) - Number(i.paid_amount || 0)),
      0
    );

  return (
    <AppShell activeItem="invoices">
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-[#22c55e]" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#22c55e]">
                SARS VAT Ledger & Billing
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-0.5">
              Tax Invoices & Receivables
            </h1>
            <p className="text-xs sm:text-sm font-medium text-[#7a7a7a] mt-0.5">
              Official workshop tax invoices, client payment links, and settlement tracking.
            </p>
          </div>

          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 rounded-xl bg-[#181818] border border-[#2c2c2c] px-4 py-2.5 text-xs font-bold text-white hover:border-[#22c55e]/50 transition-all self-start sm:self-auto"
          >
            <span>🔧 Generate from Repair Orders →</span>
          </Link>
        </div>

        {/* Financial KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="rounded-2xl bg-[#141414] border border-[#242424] p-4">
            <span className="text-[10px] uppercase font-extrabold text-[#737373] tracking-wider block">
              Total Billed (Incl. VAT)
            </span>
            <span className="font-mono text-xl font-black text-white mt-1 block">
              {formatCurrency(totalBilled)}
            </span>
            <span className="text-[11px] text-[#666] mt-0.5 block">
              {invoices.length} issued tax {invoices.length === 1 ? "invoice" : "invoices"}
            </span>
          </div>

          <div className="rounded-2xl bg-[#141414] border border-[#242424] p-4">
            <span className="text-[10px] uppercase font-extrabold text-[#737373] tracking-wider block">
              Collected Revenue
            </span>
            <span className="font-mono text-xl font-black text-[#22c55e] mt-1 block">
              {formatCurrency(totalCollected)}
            </span>
            <span className="text-[11px] text-[#666] mt-0.5 block">
              Settled via Card, EFT & Cash
            </span>
          </div>

          <div className="rounded-2xl bg-[#141414] border border-[#242424] p-4">
            <span className="text-[10px] uppercase font-extrabold text-[#737373] tracking-wider block">
              Outstanding Balance
            </span>
            <span
              className={`font-mono text-xl font-black mt-1 block ${
                totalOutstanding > 0 ? "text-[#f59e0b]" : "text-[#22c55e]"
              }`}
            >
              {formatCurrency(totalOutstanding)}
            </span>
            <span className="text-[11px] text-[#666] mt-0.5 block">
              Accounts receivable due
            </span>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={loadInvoices}
              className="text-xs font-bold underline hover:text-white"
            >
              Retry
            </button>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {STATUS_FILTERS.map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition-all min-h-[38px] select-none touch-manipulation cursor-pointer ${
                  active
                    ? "bg-[#22c55e] text-black shadow-md"
                    : "bg-[#141414] text-[#8e8e8e] border border-[#242424] hover:border-[#383838] hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {isLoading && (
          <div className="py-12 text-center text-[#737373] text-sm animate-pulse">
            Loading live tax invoices from database...
          </div>
        )}

        {!isLoading && filteredInvoices.length === 0 && (
          <div className="py-16 text-center rounded-2xl border border-dashed border-[#262626] p-8 space-y-3">
            <p className="text-base font-bold text-neutral-300">
              No tax invoices match this view
            </p>
            <p className="text-xs text-[#737373] max-w-md mx-auto">
              Open any Repair Order and click &ldquo;Tax Invoice &amp; Print&rdquo; to generate an official SARS tax invoice from live job line items.
            </p>
            <Link
              href="/jobs"
              className="inline-block rounded-xl bg-[#22c55e] px-4 py-2 text-xs font-black text-black hover:bg-[#16a34a]"
            >
              Go to Repair Orders
            </Link>
          </div>
        )}

        {/* Invoices List */}
        {!isLoading && filteredInvoices.length > 0 && (
          <div className="space-y-3.5">
            {filteredInvoices.map((inv) => {
              const statusCfg = STATUS_CONFIG[inv.status] || STATUS_CONFIG.sent;
              const balance =
                inv.status === "paid"
                  ? 0
                  : Math.max(0, Number(inv.total_amount) - Number(inv.paid_amount));

              return (
                <Link
                  key={inv.id}
                  href={`/invoices/${inv.id}`}
                  className="group block rounded-2xl bg-[#141414] border border-[#242424] p-5 hover:border-[#22c55e]/50 transition-all shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-[#1f1f1f]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black text-black bg-[#22c55e] px-2.5 py-0.5 rounded-md">
                        {inv.invoice_number}
                      </span>
                      {inv.ro_number && (
                        <span className="font-mono text-xs font-bold text-neutral-300 bg-[#1c1c1c] border border-[#2e2e2e] px-2.5 py-0.5 rounded-md">
                          {inv.ro_number}
                        </span>
                      )}
                      {inv.license_plate && (
                        <span className="font-mono text-xs font-bold text-[#ededed] bg-[#1a1a1a] border border-[#303030] px-2 py-0.5 rounded-md uppercase">
                          {inv.license_plate}
                        </span>
                      )}
                      <span className="text-xs text-[#737373]">
                        Issued {formatDate(inv.created_at)} • Due {formatDate(inv.due_date)}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${statusCfg.text} ${statusCfg.bg} border ${statusCfg.border}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                      {statusCfg.label}
                    </span>
                  </div>

                  <div className="pt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <h2 className="text-base font-bold text-white group-hover:text-[#22c55e] transition-colors">
                        {inv.customer_name || `Tax Invoice #${inv.invoice_number}`}
                        {inv.vehicle_name ? (
                          <span className="text-neutral-400 font-medium text-sm">
                            {" "}
                            — {inv.vehicle_name}
                          </span>
                        ) : null}
                      </h2>
                      <p className="text-xs text-[#8c8c8c]">
                        Excl. VAT: <span className="font-mono text-neutral-300">{formatCurrency(inv.subtotal)}</span>{" "}
                        · VAT ({inv.tax_rate_percent}%):{" "}
                        <span className="font-mono text-neutral-300">{formatCurrency(inv.tax_amount)}</span>
                        {inv.items && inv.items.length > 0 ? (
                          <span> · {inv.items.length} line items</span>
                        ) : null}
                      </p>
                    </div>

                    <div className="flex sm:flex-col items-baseline sm:items-end justify-between gap-2">
                      <div className="sm:text-right">
                        <span className="text-[10px] uppercase tracking-wider text-[#737373] block">
                          Invoice Total
                        </span>
                        <span className="font-mono text-lg font-black text-white group-hover:text-[#22c55e] transition-colors">
                          {formatCurrency(inv.total_amount)}
                        </span>
                      </div>
                      {balance > 0 ? (
                        <span className="font-mono text-xs font-bold text-[#f59e0b]">
                          Balance Due: {formatCurrency(balance)}
                        </span>
                      ) : (
                        <span className="font-mono text-xs font-bold text-[#22c55e]">
                          Settled in Full ✓
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
