"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import {
  MOCK_INVOICES,
  MOCK_REPAIR_ORDERS,
  MOCK_WORKSHOP,
  formatCurrency,
} from "@/lib/mock-data";
import { Invoice, PaymentStatus } from "@/lib/types";

const STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; text: string; bg: string; border: string }
> = {
  draft: {
    label: "Draft",
    text: "text-neutral-400",
    bg: "bg-neutral-800/40",
    border: "border-neutral-700/40",
  },
  sent: {
    label: "Sent / Unpaid",
    text: "text-[#f59e0b]",
    bg: "bg-[#f59e0b]/10",
    border: "border-[#f59e0b]/30",
  },
  "partially-paid": {
    label: "Partially Paid",
    text: "text-[#38bdf8]",
    bg: "bg-[#38bdf8]/10",
    border: "border-[#38bdf8]/30",
  },
  paid: {
    label: "Paid in Full",
    text: "text-[#22c55e]",
    bg: "bg-[#22c55e]/10",
    border: "border-[#22c55e]/30",
  },
  overdue: {
    label: "Overdue",
    text: "text-[#ef4444]",
    bg: "bg-[#ef4444]/10",
    border: "border-[#ef4444]/30",
  },
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const foundInvoice =
    MOCK_INVOICES.find(
      (inv) =>
        inv.id === id ||
        inv.invoiceNumber.toLowerCase() === id?.toLowerCase() ||
        inv.roId === id,
    ) || MOCK_INVOICES[0];

  const [invoice, setInvoice] = useState<Invoice>(foundInvoice);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);

  // Match repair order to pull exact parts and labor line items
  const matchedRO = MOCK_REPAIR_ORDERS.find(
    (ro) => ro.id === invoice.roId || ro.roNumber === invoice.roNumber,
  );

  // Fallback line items if no exact RO matched
  const partsItems = matchedRO?.parts ?? [
    {
      id: "p-def1",
      name: "OEM Maintenance Parts Kit",
      qty: 1,
      unitPrice: invoice.subtotal * 0.6,
    },
  ];
  const laborItems = matchedRO?.labor ?? [
    {
      id: "l-def1",
      description: "Workshop diagnostic & mechanical service labor",
      hours: 2.5,
      rate: 480,
    },
  ];

  const partsSubtotal = partsItems.reduce(
    (acc, p) => acc + p.qty * p.unitPrice,
    0,
  );
  const laborSubtotal = laborItems.reduce(
    (acc, l) => acc + l.hours * l.rate,
    0,
  );
  const calculatedSubtotal = partsSubtotal + laborSubtotal;
  const calculatedVat = calculatedSubtotal * (invoice.taxRatePercent / 100);
  const grandTotal = calculatedSubtotal + calculatedVat;
  const balanceDue =
    invoice.paymentStatus === "paid" ? 0 : grandTotal - invoice.amountPaid;

  const handleMarkAsPaid = () => {
    setInvoice((prev) => ({
      ...prev,
      paymentStatus: "paid",
      amountPaid: grandTotal,
    }));
    setShowPaymentSuccess(true);
    setTimeout(() => setShowPaymentSuccess(false), 4000);
  };

  const statusCfg = STATUS_CONFIG[invoice.paymentStatus];

  return (
    <AppShell activeItem="invoices">
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        {/* Top Control Bar (Hidden on Print) */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#212121] pb-5">
          <div className="space-y-1">
            <Link
              href="/invoices"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8c8c8c] hover:text-white transition-colors"
            >
              <span>← Back to Invoices</span>
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {invoice.invoiceNumber}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${statusCfg.text.replace("text-", "bg-")}`}
                />
                {statusCfg.label}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {invoice.paymentStatus !== "paid" && (
              <button
                onClick={handleMarkAsPaid}
                className="min-h-[42px] inline-flex items-center gap-2 rounded-xl bg-[#1a1a1a] border border-[#2e2e2e] px-4 py-2 text-xs font-bold text-[#22c55e] hover:bg-[#22c55e]/10 hover:border-[#22c55e]/30 transition-all select-none touch-manipulation"
              >
                <span>💳 Mark as Paid</span>
              </button>
            )}

            <a
              href={`https://wa.me/${invoice.customerPhone.replace(/\s+/g, "")}?text=Hi%20${encodeURIComponent(
                invoice.customerName,
              )},%20here%20is%20your%20tax%20invoice%20${invoice.invoiceNumber}%20from%20${encodeURIComponent(
                MOCK_WORKSHOP.name,
              )}%20for%20total%20${formatCurrency(grandTotal)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[42px] inline-flex items-center gap-2 rounded-xl bg-[#1a1a1a] border border-[#2e2e2e] px-4 py-2 text-xs font-bold text-neutral-200 hover:bg-[#262626] transition-all select-none touch-manipulation"
            >
              <span>💬 WhatsApp</span>
            </a>

            <button
              onClick={() => window.print()}
              className="min-h-[42px] inline-flex items-center gap-2 rounded-xl bg-[#22c55e] px-4 py-2 text-xs font-bold text-black hover:bg-[#16a34a] shadow-md transition-all select-none touch-manipulation"
            >
              <span>🖨️ Print Invoice (A4)</span>
            </button>
          </div>
        </div>

        {/* Payment Confirmation Banner */}
        {showPaymentSuccess && (
          <div className="no-print rounded-2xl bg-[#22c55e]/10 border border-[#22c55e]/30 p-4 flex items-center gap-3 text-sm text-[#22c55e] animate-in fade-in slide-in-from-top-2 duration-300">
            <span className="text-xl">✅</span>
            <div>
              <p className="font-bold">Payment Successfully Recorded!</p>
              <p className="text-xs text-[#86efac]">
                Invoice marked as Paid in Full. Receipt notification sent to
                customer.
              </p>
            </div>
          </div>
        )}

        {/* ─── Printable Tax Invoice Sheet ───────────────────────────────── */}
        <div className="rounded-3xl bg-[#141414] border border-[#242424] p-6 sm:p-10 shadow-xl space-y-8 print:p-0 print:border-none print:bg-white print:text-black">
          {/* Header & Letterhead */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-[#242424] pb-6 print:border-black">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#22c55e] text-black font-black text-sm print:hidden">
                  MM
                </div>
                <span className="text-xl sm:text-2xl font-black text-white tracking-tight print:text-black">
                  {MOCK_WORKSHOP.name}
                </span>
              </div>
              <p className="text-xs text-[#8a8a8a] print:text-neutral-700 max-w-sm leading-relaxed">
                {MOCK_WORKSHOP.address}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#8a8a8a] print:text-neutral-700 pt-1 font-mono">
                <span>Tel: {MOCK_WORKSHOP.phone}</span>
                <span>Email: {MOCK_WORKSHOP.email}</span>
                <span className="font-bold text-neutral-300 print:text-black">
                  VAT Reg: {MOCK_WORKSHOP.vatNumber}
                </span>
              </div>
            </div>

            {/* Document Meta Badge */}
            <div className="sm:text-right space-y-1 shrink-0">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#22c55e] print:text-black">
                TAX INVOICE
              </h2>
              <p className="font-mono text-sm font-black text-white print:text-black">
                {invoice.invoiceNumber}
              </p>
              <div className="space-y-0.5 text-xs text-[#8a8a8a] print:text-neutral-700 font-medium">
                <p>
                  Date Issued:{" "}
                  <span className="text-white print:text-black font-semibold">
                    {invoice.issueDate}
                  </span>
                </p>
                <p>
                  Payment Due:{" "}
                  <span className="text-white print:text-black font-semibold">
                    {invoice.dueDate}
                  </span>
                </p>
                {invoice.roNumber && (
                  <p>
                    Repair Order:{" "}
                    <Link
                      href={`/jobs/${invoice.roId}`}
                      className="text-[#22c55e] hover:underline font-bold print:text-black"
                    >
                      {invoice.roNumber}
                    </Link>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Billed To & Vehicle Information (Two-Column Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-[#181818] print:bg-[#f9fafb] p-5 rounded-2xl border border-[#262626] print:border-[#d1d5db]">
            {/* Customer Information */}
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#737373] print:text-neutral-600 block">
                Billed To (Customer)
              </span>
              <p className="text-base font-bold text-white print:text-black">
                {invoice.customerName}
              </p>
              <div className="space-y-1 text-xs text-[#8a8a8a] print:text-neutral-700">
                <p>{invoice.customerAddress}</p>
                <p className="font-mono">{invoice.customerPhone}</p>
                <p>{invoice.customerEmail}</p>
              </div>
            </div>

            {/* Vehicle Information */}
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#737373] print:text-neutral-600 block">
                Vehicle Serviced
              </span>
              <div className="flex items-center gap-2">
                <p className="text-base font-bold text-white print:text-black">
                  {invoice.vehicleName}
                </p>
                <span className="font-mono text-xs font-bold text-[#ededed] print:text-black bg-[#242424] print:bg-neutral-200 border border-[#383838] print:border-black px-2.5 py-0.5 rounded-md uppercase">
                  {invoice.licensePlate}
                </span>
              </div>
              <div className="space-y-1 text-xs text-[#8a8a8a] print:text-neutral-700 font-mono">
                {matchedRO?.vin && <p>VIN: {matchedRO.vin}</p>}
                <p>Workshop Bay: Bay 1 (Alex Ndlovu - Lead Tech)</p>
              </div>
            </div>
          </div>

          {/* Itemized Parts Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#a3a3a3] print:text-black">
                1. Parts & Materials
              </h3>
              <span className="font-mono text-xs font-bold text-white print:text-black">
                {formatCurrency(partsSubtotal)}
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#242424] print:border-black">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1a1a1a] print:bg-neutral-100 text-[#737373] print:text-black uppercase text-[10px] tracking-wider border-b border-[#242424] print:border-black">
                  <tr>
                    <th className="px-4 py-2.5 font-bold">Item Description</th>
                    <th className="px-3 py-2.5 font-bold text-center w-16">
                      Qty
                    </th>
                    <th className="px-4 py-2.5 font-bold text-right w-28">
                      Unit Price
                    </th>
                    <th className="px-4 py-2.5 font-bold text-right w-28">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#212121] print:divide-black font-medium">
                  {partsItems.map((part) => (
                    <tr
                      key={part.id}
                      className="hover:bg-[#1a1a1a]/50 print:hover:bg-transparent"
                    >
                      <td className="px-4 py-3 text-white print:text-black font-medium">
                        {part.name}
                      </td>
                      <td className="px-3 py-3 text-center text-[#8e8e8e] print:text-black font-mono">
                        {part.qty}
                      </td>
                      <td className="px-4 py-3 text-right text-[#8e8e8e] print:text-black font-mono">
                        {formatCurrency(part.unitPrice)}
                      </td>
                      <td className="px-4 py-3 text-right text-white print:text-black font-mono font-semibold">
                        {formatCurrency(part.qty * part.unitPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Itemized Labor Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#a3a3a3] print:text-black">
                2. Mechanical Labor & Diagnostics
              </h3>
              <span className="font-mono text-xs font-bold text-white print:text-black">
                {formatCurrency(laborSubtotal)}
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#242424] print:border-black">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1a1a1a] print:bg-neutral-100 text-[#737373] print:text-black uppercase text-[10px] tracking-wider border-b border-[#242424] print:border-black">
                  <tr>
                    <th className="px-4 py-2.5 font-bold">
                      Labor Operation Description
                    </th>
                    <th className="px-3 py-2.5 font-bold text-center w-16">
                      Hours
                    </th>
                    <th className="px-4 py-2.5 font-bold text-right w-28">
                      Rate/Hr
                    </th>
                    <th className="px-4 py-2.5 font-bold text-right w-28">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#212121] print:divide-black font-medium">
                  {laborItems.map((lab) => (
                    <tr
                      key={lab.id}
                      className="hover:bg-[#1a1a1a]/50 print:hover:bg-transparent"
                    >
                      <td className="px-4 py-3 text-white print:text-black font-medium">
                        {lab.description}
                      </td>
                      <td className="px-3 py-3 text-center text-[#8e8e8e] print:text-black font-mono">
                        {lab.hours.toFixed(1)}
                      </td>
                      <td className="px-4 py-3 text-right text-[#8e8e8e] print:text-black font-mono">
                        {formatCurrency(lab.rate)}
                      </td>
                      <td className="px-4 py-3 text-right text-white print:text-black font-mono font-semibold">
                        {formatCurrency(lab.hours * lab.rate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Calculation Summary & Payment Remittance */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 pt-4 border-t border-[#242424] print:border-black">
            {/* Left: Banking / Remittance Details */}
            <div className="sm:col-span-7 rounded-2xl bg-[#181818] print:bg-[#f9fafb] p-4 border border-[#262626] print:border-[#d1d5db] space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#737373] print:text-neutral-600 block">
                Direct EFT Remittance Information
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-[#8a8a8a] print:text-neutral-600">
                    Bank Name:
                  </p>
                  <p className="font-semibold text-white print:text-black">
                    Standard Bank SA
                  </p>
                </div>
                <div>
                  <p className="text-[#8a8a8a] print:text-neutral-600">
                    Account Name:
                  </p>
                  <p className="font-semibold text-white print:text-black">
                    Dev&apos;s Auto Workshop (Pty) Ltd
                  </p>
                </div>
                <div>
                  <p className="text-[#8a8a8a] print:text-neutral-600">
                    Account Number:
                  </p>
                  <p className="font-mono font-bold text-white print:text-black">
                    021 984 5510
                  </p>
                </div>
                <div>
                  <p className="text-[#8a8a8a] print:text-neutral-600">
                    Branch Code:
                  </p>
                  <p className="font-mono font-bold text-white print:text-black">
                    051001
                  </p>
                </div>
                <div className="col-span-2 pt-1 border-t border-[#262626] print:border-neutral-300">
                  <p className="text-[#8a8a8a] print:text-neutral-600">
                    Payment Reference:
                  </p>
                  <p className="font-mono font-black text-[#22c55e] print:text-black text-sm">
                    {invoice.invoiceNumber}
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-[#6d6d6d] print:text-neutral-500 pt-1">
                * All repairs carry a 6-month / 10,000 km workmanship guarantee.
                Parts warranted under manufacturer policy.
              </p>
            </div>

            {/* Right: Totals Breakdown */}
            <div className="sm:col-span-5 space-y-2.5 self-center">
              <div className="flex justify-between text-xs text-[#8e8e8e] print:text-neutral-700">
                <span>Subtotal (Excl. VAT):</span>
                <span className="font-mono text-white print:text-black">
                  {formatCurrency(calculatedSubtotal)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-[#8e8e8e] print:text-neutral-700">
                <span>VAT ({invoice.taxRatePercent}%):</span>
                <span className="font-mono text-white print:text-black">
                  {formatCurrency(calculatedVat)}
                </span>
              </div>
              <div className="flex justify-between text-base font-black text-white print:text-black pt-2 border-t border-[#282828] print:border-black">
                <span>Invoice Total:</span>
                <span className="font-mono text-[#22c55e] print:text-black">
                  {formatCurrency(grandTotal)}
                </span>
              </div>

              {invoice.amountPaid > 0 && (
                <div className="flex justify-between text-xs text-[#38bdf8] print:text-neutral-700">
                  <span>Less Amount Paid:</span>
                  <span className="font-mono">
                    -{formatCurrency(invoice.amountPaid)}
                  </span>
                </div>
              )}

              <div className="rounded-xl bg-[#1c1c1c] print:bg-neutral-100 p-3 border border-[#2d2d2d] print:border-black flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 print:text-neutral-800">
                  Balance Due:
                </span>
                <span
                  className={`font-mono text-lg font-black ${
                    balanceDue === 0 ? "text-[#22c55e]" : "text-[#ef4444]"
                  } print:text-black`}
                >
                  {formatCurrency(balanceDue)}
                </span>
              </div>
            </div>
          </div>

          {/* Signature & Authorization Block */}
          <div className="pt-6 border-t border-[#242424] print:border-black grid grid-cols-2 gap-8 text-xs text-[#737373] print:text-neutral-700">
            <div>
              <p className="font-bold text-neutral-300 print:text-black">
                Workshop Authorized Representative:
              </p>
              <div className="h-10 border-b border-[#333333] print:border-black mt-4 flex items-end pb-1 font-mono text-neutral-400 print:text-black">
                Alex Ndlovu (Lead Master Technician)
              </div>
              <p className="text-[10px] text-[#555] print:text-neutral-500 mt-1">
                Authorized Signature & Date
              </p>
            </div>
            <div>
              <p className="font-bold text-neutral-300 print:text-black">
                Customer Acceptance / Received By:
              </p>
              <div className="h-10 border-b border-[#333333] print:border-black mt-4 flex items-end pb-1 font-mono text-neutral-400 print:text-black">
                {invoice.customerName}
              </div>
              <p className="text-[10px] text-[#555] print:text-neutral-500 mt-1">
                Signature upon vehicle handover
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
