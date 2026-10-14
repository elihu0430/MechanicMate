"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useApi } from "@/lib/api/use-api";
import { formatCurrency, formatDate } from "@/lib/format";
import { type ApiInvoice, type ApiPayment } from "@/lib/api/invoices";

interface DisplayPayment {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  method: string;
  date: string;
  time: string;
  reference: string;
}

export default function PaymentsPage() {
  const api = useApi();
  const [payments, setPayments] = useState<DisplayPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    api.invoices
      .list()
      .then((invoices: ApiInvoice[]) => {
        if (!isMounted) return;
        const allPayments: DisplayPayment[] = [];
        for (const inv of invoices) {
          if (inv.payments && inv.payments.length > 0) {
            for (const p of inv.payments) {
              const d = new Date(p.created_at);
              allPayments.push({
                id: p.id,
                invoiceId: inv.id,
                invoiceNumber: inv.invoice_number,
                amount: p.amount,
                method: p.payment_method ? p.payment_method.toUpperCase() : "CASH",
                date: formatDate(p.created_at),
                time: isNaN(d.getTime()) ? "" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                reference: p.transaction_reference || "Direct Settlement",
              });
            }
          }
        }
        // Sort descending by id or date
        setPayments(allPayments);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Failed to load payments:", err);
        setError("Failed to fetch payments records.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <AppShell activeItem="invoices">
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#212121] pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Payments & Cashier Log
            </h1>
            <p className="text-xs sm:text-sm text-[#7a7a7a] mt-0.5">
              Daily cash drawer, card POS settlement, and instant EFT reconciliations.
            </p>
          </div>

          <div className="rounded-2xl bg-[#141414] border border-[#242424] px-4 py-2.5">
            <span className="text-[10px] uppercase font-bold text-[#737373] block">
              Total Recorded Payments
            </span>
            <span className="font-mono text-lg font-black text-[#22c55e]">
              {formatCurrency(totalCollected)}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/50 text-red-300 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-[#737373] text-sm animate-pulse">
            Loading live payment transactions...
          </div>
        ) : payments.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-dashed border-[#262626] p-8 space-y-2">
            <p className="text-base font-bold text-neutral-300">No payment transactions recorded yet</p>
            <p className="text-xs text-[#737373]">
              Payments recorded when settling customer invoices will appear here in real-time.
            </p>
          </div>
        ) : (
          <div className="rounded-3xl bg-[#141414] border border-[#242424] p-5 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-[#a3a3a3]">
              Recent Receipts & Settlements
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1a1a1a] text-[#737373] uppercase text-[10px] tracking-wider border-b border-[#242424]">
                  <tr>
                    <th className="px-4 py-3 font-bold">Time & Date</th>
                    <th className="px-4 py-3 font-bold">Invoice</th>
                    <th className="px-4 py-3 font-bold">Method</th>
                    <th className="px-4 py-3 font-bold">Reference</th>
                    <th className="px-4 py-3 font-bold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#212121]">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-[#1a1a1a]/40">
                      <td className="px-4 py-3 text-[#8a8a8a] font-mono">
                        <p className="text-white font-bold">{p.time}</p>
                        <p className="text-[11px]">{p.date}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/invoices/${p.invoiceId}`}
                          className="font-bold text-[#22c55e] hover:underline"
                        >
                          Invoice #{p.invoiceNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-[#242424] text-neutral-200 px-2 py-0.5 rounded text-[11px] font-medium">
                          {p.method}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[#737373]">
                        {p.reference}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-black text-[#22c55e]">
                        {formatCurrency(p.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
