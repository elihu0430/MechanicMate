"use client";

import React, { useState } from "react";
import { formatCurrency } from "@/lib/mock-data";

interface PaymentRecord {
  id: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  method: "Cash" | "Credit Card" | "Instant EFT" | "Ozow";
  date: string;
  time: string;
  reference: string;
}

const INITIAL_PAYMENTS: PaymentRecord[] = [
  {
    id: "pay-1",
    invoiceNumber: "INV-2026-1044",
    customerName: "John Smith",
    amount: 2817.5,
    method: "Credit Card",
    date: "10 Sep 2026",
    time: "14:22",
    reference: "POS-TX-99021",
  },
  {
    id: "pay-2",
    invoiceNumber: "INV-2026-1042",
    customerName: "Thabo Dlamini",
    amount: 1720.0,
    method: "Instant EFT",
    date: "10 Sep 2026",
    time: "11:05",
    reference: "SB-EFT-44120",
  },
  {
    id: "pay-3",
    invoiceNumber: "INV-2026-1041",
    customerName: "Amahle Nkosi",
    amount: 500.0,
    method: "Cash",
    date: "09 Sep 2026",
    time: "16:45",
    reference: "CASH-REC-082",
  },
];

export default function PaymentsPage() {
  const [payments] = useState<PaymentRecord[]>(INITIAL_PAYMENTS);

  const totalCollectedToday = payments
    .filter((p) => p.date === "10 Sep 2026")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#212121] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Payments & Cashier Log
          </h1>
          <p className="text-xs sm:text-sm text-[#7a7a7a] mt-0.5">
            Daily cash drawer, card POS settlement, and instant EFT
            reconciliations.
          </p>
        </div>

        <div className="rounded-2xl bg-[#141414] border border-[#242424] px-4 py-2.5">
          <span className="text-[10px] uppercase font-bold text-[#737373] block">
            Collected Today
          </span>
          <span className="font-mono text-lg font-black text-[#22c55e]">
            {formatCurrency(totalCollectedToday)}
          </span>
        </div>
      </div>

      {/* Payment Transactions Table */}
      <div className="rounded-3xl bg-[#141414] border border-[#242424] p-5 space-y-4">
        <h2 className="text-xs font-black uppercase tracking-wider text-[#a3a3a3]">
          Recent Receipts & Settlements
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1a1a1a] text-[#737373] uppercase text-[10px] tracking-wider border-b border-[#242424]">
              <tr>
                <th className="px-4 py-3 font-bold">Time & Date</th>
                <th className="px-4 py-3 font-bold">Invoice & Customer</th>
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
                    <p className="font-bold text-white">{p.customerName}</p>
                    <p className="text-[11px] font-mono text-[#22c55e]">
                      {p.invoiceNumber}
                    </p>
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
    </div>
  );
}
