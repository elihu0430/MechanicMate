"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { type ApiInvoice } from "@/lib/api/invoices";
import { useApi } from "@/lib/api/use-api";
import { formatCurrency } from "@/lib/format";

const STATUS_FILTERS = [
  { id: "all", label: "All Invoices" },
  { id: "sent", label: "Sent / Unpaid" },
  { id: "paid", label: "Paid" },
  { id: "partially-paid", label: "Partially Paid" },
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
    label: "Sent / Unpaid",
    text: "text-[#f59e0b]",
    bg: "bg-[#f59e0b]/10",
    dot: "bg-[#f59e0b]",
    border: "border-[#f59e0b]/20",
  },
  "partially-paid": {
    label: "Partially Paid",
    text: "text-[#38bdf8]",
    bg: "bg-[#38bdf8]/10",
    dot: "bg-[#38bdf8]",
    border: "border-[#38bdf8]/20",
  },
  paid: {
    label: "Paid in Full",
    text: "text-[#22c55e]",
    bg: "bg-[#22c55e]/10",
    dot: "bg-[#22c55e]",
    border: "border-[#22c55e]/20",
  },
  cancelled: {
    label: "Cancelled",
    text: "text-[#ef4444]",
    bg: "bg-[#ef4444]/10",
    dot: "bg-[#ef4444]",
    border: "border-[#ef4444]/20",
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
    (inv) => filter === "all" || inv.status === filter,
  );

  const totalOutstanding = invoices
    .filter((i) => i.status !== "paid" && i.status !== "cancelled")
    .reduce((s, i) => s + (i.total_amount - i.paid_amount), 0);

  return (
    <AppShell activeItem="invoices">
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Invoices & Billing
            </h1>
            <p className="text-xs sm:text-sm font-medium text-[#7a7a7a] mt-0.5">
              Live tax invoices, payments reconciliation, and accounts receivable.
            </p>
          </div>

          <div className="rounded-xl bg-[#141414] border border-[#242424] px-4 py-2 self-start sm:self-auto">
            <span className="text-[10px] uppercase font-bold text-[#737373] tracking-wider block">
              Total Uncollected
            </span>
            <span className="font-mono text-base font-black text-[#ef4444]">
              {formatCurrency(totalOutstanding)}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={loadInvoices} className="text-xs font-bold underline hover:text-white">
              Retry
            </button>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
          {STATUS_FILTERS.map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition-all min-h-[38px] select-none touch-manipulation ${
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
            Loading invoices from database...
          </div>
        )}

        {!isLoading && filteredInvoices.length === 0 && (
          <div className="py-16 text-center rounded-2xl border border-dashed border-[#262626] p-8 space-y-2">
            <p className="text-base font-bold text-neutral-300">No invoices in database yet</p>
            <p className="text-xs text-[#737373]">
              Invoices are automatically generated when repair orders are completed or billed.
            </p>
          </div>
        )}

        {/* Invoices List */}
        {!isLoading && filteredInvoices.length > 0 && (
          <div className="space-y-3.5">
            {filteredInvoices.map((inv) => {
              const statusCfg = STATUS_CONFIG[inv.status] || STATUS_CONFIG.sent;
              return (
                <Link
                  key={inv.id}
                  href={`/invoices/${inv.id}`}
                  className="group block rounded-2xl bg-[#141414] border border-[#242424] p-5 hover:border-[#383838] transition-all shadow-sm"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-[#1f1f1f]">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-white bg-[#1a1a1a] border border-[#2c2c2c] px-2.5 py-0.5 rounded">
                        {inv.invoice_number}
                      </span>
                      <span className="text-xs text-[#737373]">
                        Issued: {new Date(inv.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusCfg.text} ${statusCfg.bg} border ${statusCfg.border}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                      {statusCfg.label}
                    </span>
                  </div>

                  <div className="pt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h2 className="text-base font-bold text-white group-hover:text-[#22c55e] transition-colors">
                        Invoice #{inv.invoice_number}
                      </h2>
                      <p className="text-xs text-[#8c8c8c] mt-0.5">
                        Subtotal: {formatCurrency(inv.subtotal)} · VAT ({inv.tax_rate_percent}%): {formatCurrency(inv.tax_amount)}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="font-mono text-base font-black text-[#22c55e] block">
                        {formatCurrency(inv.total_amount)}
                      </span>
                      {inv.paid_amount > 0 && inv.paid_amount < inv.total_amount && (
                        <span className="font-mono text-xs text-[#38bdf8]">
                          Paid: {formatCurrency(inv.paid_amount)}
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
