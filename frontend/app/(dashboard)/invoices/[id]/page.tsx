"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { type ApiInvoice } from "@/lib/api/invoices";
import { type RepairOrderRead } from "@/lib/api/jobs";
import { useApi } from "@/lib/api/use-api";
import { formatCurrency, formatDate } from "@/lib/format";

const WORKSHOP_INFO = {
  name: "MechanicMate Workshop",
  vatNumber: "ZA-4902188201",
  phone: "+27 11 482 9900",
  email: "billing@mechanicmate.co.za",
  address: "Unit 4, Industrial Park, Main Reef Road, Johannesburg, 2092",
};

const STATUS_CONFIG: Record<
  string,
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
  const api = useApi();

  const [invoice, setInvoice] = useState<ApiInvoice | null>(null);
  const [job, setJob] = useState<RepairOrderRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    api.invoices.get(id)
      .then(async (inv) => {
        setInvoice(inv);
        if (inv.repair_order_id) {
          try {
            const jobData = await api.jobs.get(inv.repair_order_id);
            setJob(jobData);
          } catch (e) {
            console.warn("Could not load associated repair order:", e);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load invoice:", err);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleMarkAsPaid = async () => {
    if (!invoice) return;
    const balance = invoice.total_amount - invoice.paid_amount;
    if (balance <= 0) return;

    try {
      setProcessingPayment(true);
      await api.invoices.recordPayment(invoice.id, {
        amount: balance,
        payment_method: "card",
        transaction_reference: `POS-${Date.now().toString().slice(-6)}`,
      });

      setInvoice({
        ...invoice,
        paid_amount: invoice.total_amount,
        status: "paid",
      });
      setShowPaymentSuccess(true);
      setTimeout(() => setShowPaymentSuccess(false), 4000);
    } catch (err) {
      console.error("Failed to record payment:", err);
      alert("Failed to record payment. Please try again.");
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <AppShell activeItem="invoices">
        <div className="mx-auto max-w-4xl px-4 py-16 flex flex-col items-center justify-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#22c55e] border-t-transparent" />
          <p className="text-xs text-[#8c8c8c]">Loading tax invoice...</p>
        </div>
      </AppShell>
    );
  }

  if (!invoice) {
    return (
      <AppShell activeItem="invoices">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center space-y-4">
          <p className="text-sm text-red-400">Tax invoice not found</p>
          <Link
            href="/invoices"
            className="inline-block rounded-xl bg-[#22c55e] px-4 py-2 text-xs font-bold text-black hover:bg-[#16a34a]"
          >
            Return to Invoices
          </Link>
        </div>
      </AppShell>
    );
  }

  const partsItems = job?.items?.filter((i) => i.item_type === "part") || [];
  const laborItems =
    job?.items?.filter(
      (i) => i.item_type === "labour" || i.item_type === "labor"
    ) || [];

  const partsSubtotal = partsItems.reduce((acc, p) => acc + p.total_price, 0);
  const laborSubtotal = laborItems.reduce((acc, l) => acc + l.total_price, 0);
  const calculatedSubtotal =
    partsSubtotal + laborSubtotal > 0
      ? partsSubtotal + laborSubtotal
      : invoice.subtotal;
  const calculatedVat =
    partsSubtotal + laborSubtotal > 0
      ? calculatedSubtotal * (invoice.tax_rate_percent / 100)
      : invoice.tax_amount;
  const grandTotal =
    partsSubtotal + laborSubtotal > 0
      ? calculatedSubtotal + calculatedVat
      : invoice.total_amount;
  const balanceDue =
    invoice.status === "paid" ? 0 : grandTotal - invoice.paid_amount;

  const statusCfg =
    STATUS_CONFIG[invoice.status] || STATUS_CONFIG["sent"];

  const customerName = job?.customer?.name || "Cash Customer";
  const customerPhone = job?.customer?.phone || "+27 11 000 0000";
  const customerEmail = job?.customer?.email || "customer@example.co.za";
  const vehicleName = job?.vehicle
    ? `${job.vehicle.year} ${job.vehicle.make} ${job.vehicle.model}`
    : "Vehicle Service";
  const licensePlate = job?.vehicle?.license_plate || "ZA-PLATE";

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
                {invoice.invoice_number}
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
            {invoice.status !== "paid" && (
              <button
                onClick={handleMarkAsPaid}
                disabled={processingPayment}
                className="min-h-[42px] inline-flex items-center gap-2 rounded-xl bg-[#1a1a1a] border border-[#2e2e2e] px-4 py-2 text-xs font-bold text-[#22c55e] hover:bg-[#22c55e]/10 hover:border-[#22c55e]/30 transition-all select-none touch-manipulation disabled:opacity-50"
              >
                <span>{processingPayment ? "Recording..." : "💳 Mark as Paid"}</span>
              </button>
            )}

            <a
              href={`https://wa.me/${customerPhone.replace(/[\s+]/g, "")}?text=Hi%20${encodeURIComponent(
                customerName
              )},%20here%20is%20your%20tax%20invoice%20${invoice.invoice_number}%20from%20${encodeURIComponent(
                WORKSHOP_INFO.name
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
                Invoice marked as Paid in Full. Payment ledger updated in database.
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
                  {WORKSHOP_INFO.name}
                </span>
              </div>
              <p className="text-xs text-[#8a8a8a] print:text-neutral-700 max-w-sm leading-relaxed">
                {WORKSHOP_INFO.address}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#8a8a8a] print:text-neutral-700 pt-1 font-mono">
                <span>Tel: {WORKSHOP_INFO.phone}</span>
                <span>Email: {WORKSHOP_INFO.email}</span>
                <span className="font-bold text-neutral-300 print:text-black">
                  VAT Reg: {WORKSHOP_INFO.vatNumber}
                </span>
              </div>
            </div>

            {/* Document Meta Badge */}
            <div className="sm:text-right space-y-1 shrink-0">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#22c55e] print:text-black">
                TAX INVOICE
              </h2>
              <p className="font-mono text-sm font-black text-white print:text-black">
                {invoice.invoice_number}
              </p>
              <div className="space-y-0.5 text-xs text-[#8a8a8a] print:text-neutral-700 font-medium">
                <p>
                  Date Issued:{" "}
                  <span className="text-white print:text-black font-semibold">
                    {formatDate(invoice.created_at)}
                  </span>
                </p>
                <p>
                  Payment Due:{" "}
                  <span className="text-white print:text-black font-semibold">
                    {formatDate(invoice.due_date)}
                  </span>
                </p>
                {job?.ro_number && (
                  <p>
                    Repair Order:{" "}
                    <Link
                      href={`/jobs/${job.id}`}
                      className="text-[#22c55e] hover:underline font-bold print:text-black"
                    >
                      {job.ro_number}
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
                {customerName}
              </p>
              <div className="space-y-1 text-xs text-[#8a8a8a] print:text-neutral-700">
                <p className="font-mono">{customerPhone}</p>
                <p>{customerEmail}</p>
              </div>
            </div>

            {/* Vehicle Information */}
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#737373] print:text-neutral-600 block">
                Vehicle Serviced
              </span>
              <div className="flex items-center gap-2">
                <p className="text-base font-bold text-white print:text-black">
                  {vehicleName}
                </p>
                <span className="font-mono text-xs font-bold text-[#ededed] print:text-black bg-[#242424] print:bg-neutral-200 border border-[#383838] print:border-black px-2.5 py-0.5 rounded-md uppercase">
                  {licensePlate}
                </span>
              </div>
              <div className="space-y-1 text-xs text-[#8a8a8a] print:text-neutral-700 font-mono">
                {job?.vehicle?.vin && <p>VIN: {job.vehicle.vin}</p>}
                <p>Status: {job?.status || "Complete"}</p>
              </div>
            </div>
          </div>

          {/* Itemized Parts Table */}
          {partsItems.length > 0 && (
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
                          {part.description}
                        </td>
                        <td className="px-3 py-3 text-center text-[#8e8e8e] print:text-black font-mono">
                          {part.quantity}
                        </td>
                        <td className="px-4 py-3 text-right text-[#8e8e8e] print:text-black font-mono">
                          {formatCurrency(part.unit_price)}
                        </td>
                        <td className="px-4 py-3 text-right text-white print:text-black font-mono font-semibold">
                          {formatCurrency(part.total_price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Itemized Labor Table */}
          {laborItems.length > 0 && (
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
                          {(lab.labour_hours || lab.quantity).toFixed(1)}
                        </td>
                        <td className="px-4 py-3 text-right text-[#8e8e8e] print:text-black font-mono">
                          {formatCurrency(lab.labour_hourly_rate || lab.unit_price)}
                        </td>
                        <td className="px-4 py-3 text-right text-white print:text-black font-mono font-semibold">
                          {formatCurrency(lab.total_price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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
                    MechanicMate Workshop (Pty) Ltd
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
                    {invoice.invoice_number}
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
                <span>VAT ({invoice.tax_rate_percent}%):</span>
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

              {invoice.paid_amount > 0 && (
                <div className="flex justify-between text-xs text-[#38bdf8] print:text-neutral-700">
                  <span>Less Amount Paid:</span>
                  <span className="font-mono">
                    -{formatCurrency(invoice.paid_amount)}
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
                Lead Master Technician
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
                {customerName}
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
