"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { MOCK_INVOICES, formatCurrency } from "@/lib/mock-data";
import { PaymentStatus } from "@/lib/types";

const STATUS_FILTERS: { id: "all" | PaymentStatus; label: string }[] = [
  { id: "all", label: "All Invoices" },
  { id: "sent", label: "Sent / Unpaid" },
  { id: "paid", label: "Paid" },
  { id: "overdue", label: "Overdue" },
];

const STATUS_CONFIG: Record<
  PaymentStatus,
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
  overdue: {
    label: "Overdue",
    text: "text-[#ef4444]",
    bg: "bg-[#ef4444]/10",
    dot: "bg-[#ef4444]",
    border: "border-[#ef4444]/20",
  },
};

export default function InvoicesPage() {
  const [filter, setFilter] = useState<"all" | PaymentStatus>("all");

  const filteredInvoices = MOCK_INVOICES.filter(
    (inv) => filter === "all" || inv.paymentStatus === filter,
  );

  const totalOutstanding = MOCK_INVOICES.filter(
    (i) => i.paymentStatus === "sent" || i.paymentStatus === "overdue",
  ).reduce((s, i) => s + (i.total - i.amountPaid), 0);

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
              Tax invoices, payments reconciliation, and accounts receivable.
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

        {/* Invoices List */}
        <div className="space-y-3.5">
          {filteredInvoices.map((inv) => {
            const statusCfg = STATUS_CONFIG[inv.paymentStatus];
            return (
              <Link
                key={inv.id}
                href={`/invoices/${inv.id}`}
                className="group block rounded-2xl bg-[#141414] border border-[#242424] p-5 hover:border-[#383838] transition-all shadow-sm"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#1f1f1f]">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-white bg-[#1a1a1a] border border-[#2c2c2c] px-2.5 py-0.5 rounded">
                      {inv.invoiceNumber}
                    </span>
                    <span className="text-xs text-[#737373]">
                      Due: {inv.dueDate}
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusCfg.text} ${statusCfg.bg} border ${statusCfg.border}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`}
                    />
                    {statusCfg.label}
                  </span>
                </div>

                <div className="pt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold text-white group-hover:text-[#22c55e] transition-colors">
                      {inv.customerName}
                    </h2>
                    <p className="text-xs text-[#8c8c8c] mt-0.5">
                      {inv.vehicleName} ({inv.licensePlate})
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="font-mono text-base font-black text-[#22c55e] block">
                      {formatCurrency(inv.total)}
                    </span>
                    {inv.amountPaid > 0 && inv.amountPaid < inv.total && (
                      <span className="font-mono text-xs text-[#38bdf8]">
                        Paid: {formatCurrency(inv.amountPaid)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
